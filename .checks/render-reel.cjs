// Run the local site first: npm run dev
// Preview: node .checks/render-reel.cjs --width 360 --height 640 --fps 12 --duration 18 --output exports/preview.mp4
// Final:   node .checks/render-reel.cjs
// Review:  node .checks/render-reel.cjs --url http://127.0.0.1:3002 --width 540 --height 960 --stills 1
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  if (!/^--(width|height|fps|duration|output|url|start|stills)$/.test(key) || !process.argv[i + 1]) {
    throw new Error('Options: --width --height --fps --duration --output --url --start (audio seconds) --stills 1');
  }
  options[key.slice(2)] = process.argv[i + 1];
}
const width = Number(options.width || 1080);
const height = Number(options.height || 1920);
const fps = Number(options.fps || 30);
const duration = Number(options.duration || 18);
const audioStart = Number(options.start || 0);
if (![width, height].every(value => Number.isInteger(value) && value > 0 && value % 2 === 0) ||
    !Number.isFinite(fps) || fps < 1 || fps > 60 || !Number.isFinite(duration) || duration <= 0 ||
    !Number.isFinite(audioStart) || audioStart < 0) throw new Error('Invalid dimensions, frame rate, duration, or audio start');
const output = path.resolve(root, options.output || 'exports/aarambh-ganesha-reel.mp4');
const cover = output.replace(/\.mp4$/i, '') + '-cover.jpg';
const audio = path.join(root, 'Yun Toh Mushak Sawari Teri - Deva Shree Ganesha _ Ajay Atul _ Ganesh Chaturthi.mp3');
const url = new URL(options.url || 'http://127.0.0.1:3000');
url.searchParams.set('capture', '1');
url.searchParams.set('portrait', '1');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let chrome;
let encoder;
let socket;
let chromeErrors = '';
let encoderErrors = '';
const pending = new Map();
const runtimeErrors = [];
let messageId = 0;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, 30000);
    pending.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(new Error(`${method}: ${error.message}`)); },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function capture(ms) {
  await evaluate(`window.aarambh.seek(${ms}); new Promise(resolve => requestAnimationFrame(() => resolve(true)))`);
  const shot = await send('Page.captureScreenshot', {
    format: 'jpeg', quality: 96, fromSurface: true, captureBeyondViewport: false,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  return Buffer.from(shot.data, 'base64');
}

async function main() {
  if (!fs.existsSync(audio)) throw new Error(`Missing requested soundtrack: ${audio}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Local site returned ${response.status}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const profile = fs.mkdtempSync(path.join(__dirname, 'reel-profile-'));
  chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--disable-background-networking', '--disable-component-update', '--disable-sync',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  chrome.on('error', error => { chromeErrors += error.message; });
  chrome.stderr.on('data', chunk => { chromeErrors = (chromeErrors + chunk).slice(-3000); });
  let port;
  for (let attempt = 0; attempt < 80; attempt++) {
    const activePort = path.join(profile, 'DevToolsActivePort');
    if (fs.existsSync(activePort)) { port = fs.readFileSync(activePort, 'utf8').split('\n')[0].trim(); break; }
    if (chrome.exitCode !== null) throw new Error(`Chrome exited: ${chromeErrors}`);
    await sleep(250);
  }
  if (!port) throw new Error(`Chrome did not start: ${chromeErrors}`);
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  socket.addEventListener('close', () => {
    for (const request of pending.values()) request.reject(new Error('Chrome connection closed'));
    pending.clear();
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url: url.href });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    ready = await evaluate('document.readyState === "complete" && typeof window.aarambh?.seek === "function"');
    if (ready) break;
    await sleep(250);
  }
  if (!ready) throw new Error('Deterministic window.aarambh.seek(ms) is not ready');
  await evaluate('document.fonts.ready.then(() => Promise.all([...document.images].map(image => image.decode().catch(() => {}))))');
  await evaluate('window.aarambh.pause()');
  if (options.stills === '1') {
    let reference;
    for (const ms of [0, 2400, 4400, 7300, 10000, 12500, 17000]) {
      const filename = path.join(__dirname, `reel-still-${ms}.jpg`);
      const frame = await capture(ms);
      if (ms === 7300) reference = frame;
      fs.writeFileSync(filename, frame);
      console.log(`Review frame: ${filename}`);
    }
    if (!reference.equals(await capture(7300))) throw new Error('Seek is not deterministic: repeated 7300ms frame differs');
    console.log('PASS deterministic seek: repeated 7300ms frame is identical');
    if (runtimeErrors.length) throw new Error(`Browser runtime errors: ${runtimeErrors.join('\n')}`);
    return;
  }
  const fadeLength = Math.min(1.5, duration);
  encoder = spawn(process.env.FFMPEG_PATH || 'ffmpeg', [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0',
    '-ss', String(audioStart), '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0', '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-threads', '4',
    '-vf', 'scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
    '-af', `afade=t=in:st=0:d=0.12,afade=t=out:st=${duration - fadeLength}:d=${fadeLength}`,
    '-movflags', '+faststart', output,
  ], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
  encoder.stderr.on('data', chunk => { encoderErrors = (encoderErrors + chunk).slice(-5000); });
  let encodeError;
  encoder.on('error', error => { encodeError = error; });
  encoder.stdin.on('error', error => { encodeError = error; });
  const encoded = new Promise(resolve => encoder.on('close', code => resolve(code)));
  const frameCount = Math.ceil(duration * fps);
  const started = Date.now();
  console.log(`Rendering ${frameCount} frames at ${width}×${height}, ${fps}fps with the supplied soundtrack.`);
  for (let frame = 0; frame < frameCount; frame++) {
    if (encodeError || encoder.exitCode !== null) throw new Error(`Encoder stopped: ${encodeError?.message || encoderErrors}`);
    const jpeg = await capture(frame * 1000 / fps);
    if (!encoder.stdin.write(jpeg)) await once(encoder.stdin, 'drain');
    if (frame % Math.max(1, Math.round(fps)) === 0) {
      console.log(`${Math.round(frame / frameCount * 100)}% · ${(frame / fps).toFixed(1)}/${duration}s · ${((Date.now() - started) / 1000).toFixed(0)}s elapsed`);
    }
  }
  encoder.stdin.end();
  const code = await encoded;
  if (code !== 0) throw new Error(`ffmpeg failed (${code}): ${encoderErrors}`);
  fs.writeFileSync(cover, await capture(Math.max(duration * 1000, 12500)));
  if (runtimeErrors.length) throw new Error(`Browser runtime errors: ${runtimeErrors.join('\n')}`);
  console.log(`Complete: ${output}\nCover: ${cover}\nSize: ${(fs.statSync(output).size / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(error => {
  console.error(error.message);
  if (chromeErrors) console.error(chromeErrors.slice(-2000));
  process.exitCode = 1;
}).finally(async () => {
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (socket?.readyState === WebSocket.OPEN) {
    await send('Browser.close').catch(() => {});
    socket.close();
  }
  if (chrome && chrome.exitCode === null) chrome.kill();
});
