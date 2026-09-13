const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const directory = __dirname;
const previewUrl = process.env.AARAMBH_URL || 'http://127.0.0.1:3000';
console.log('Starting headless browser verification');
const watchdog = setTimeout(() => { console.error('Browser verification timed out'); process.exit(1); }, 90000);
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-component-update', '--disable-sync',
  '--remote-debugging-port=9333', `--user-data-dir=${path.join(directory, 'browser-profile')}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let chromeErrors = '';
chrome.stderr.on('data', data => chromeErrors += data.toString());
chrome.on('exit', (code, signal) => console.log('Browser process exit:', code, signal, chromeErrors.slice(-1200)));
chrome.on('error', error => { console.error(error); process.exitCode = 1; });
let connection;
const errors = [];
const networkErrors = [];
(async () => {
  let tabs;
  for (let i = 0; i < 40; i++) {
    try { tabs = await (await fetch('http://127.0.0.1:9333/json')).json(); break; }
    catch { await pause(250); }
  }
  if (!tabs) throw new Error('Chrome did not start: ' + chromeErrors.slice(-2000));
  connection = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    connection.addEventListener('open', resolve, { once: true });
    connection.addEventListener('error', () => reject(new Error('Browser connection failed')), { once: true });
  });
  console.log('Browser connected');
  const pending = new Map();
  let id = 0;
  connection.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      message.error ? item.reject(message.error) : item.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + message.params.exceptionDetails.exception?.description);
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) networkErrors.push({ url: message.params.response.url, status: message.params.response.status });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    connection.send(JSON.stringify({ id: messageId, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const check = async (label, expression) => {
    const result = await evaluate(expression);
    assert.ok(result, label);
    console.log('PASS ' + label);
  };
  const screenshot = async name => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(directory, `${name}.png`), Buffer.from(shot.data, 'base64'));
    console.log('Screenshot: ' + name);
  };
  const navigate = async () => {
    await send('Page.navigate', { url: previewUrl });
    await pause(650);
    await evaluate('document.fonts.ready.then(() => true)');
  };
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate();
  await check('initial state and local fonts', `document.getElementById('art-stage').dataset.state === 'idle' && document.fonts.check('400 20px Cormorant') && document.fonts.check('400 20px Inter')`);
  await check('desktop has no horizontal overflow', 'document.documentElement.scrollWidth <= innerWidth');
  await check('master clock and portrait control available', `typeof window.aarambh?.seek === 'function' && !!document.getElementById('portrait-button')`);
  await evaluate(`document.getElementById('pause-button').click()`);
  await check('idle motion can be paused', `window.aarambh.paused && document.body.classList.contains('is-paused')`);
  await evaluate(`document.getElementById('pause-button').click()`);
  await check('idle resume preserves the opening scene', `!window.aarambh.paused && window.aarambh.state === 'idle'`);
  await screenshot('desktop-idle');
  await evaluate(`document.getElementById('awaken-button').click()`);
  await pause(4900);
  await check('supplied song is actually playing', `document.getElementById('background-music')?.currentTime > 1 && !document.getElementById('background-music').paused && decodeURIComponent(document.getElementById('background-music').currentSrc).includes('Yun Toh Mushak Sawari Teri')`);
  await check('reveal progresses, button locked', `document.getElementById('art-stage').dataset.state === 'revealing' && document.getElementById('awaken-button').disabled && [...document.querySelectorAll('.draw-path')].some(p => parseFloat(p.style.strokeDashoffset) === 0)`);
  await screenshot('desktop-forming');
  await evaluate(`document.getElementById('pause-button').click()`);
  const pausedPaths = await evaluate(`JSON.stringify([...document.querySelectorAll('.draw-path')].map(p => p.style.strokeDashoffset))`);
  await pause(450);
  assert.equal(await evaluate(`JSON.stringify([...document.querySelectorAll('.draw-path')].map(p => p.style.strokeDashoffset))`), pausedPaths, 'Paused reveal must not advance');
  await check('pause control reflects frozen clock', `document.getElementById('pause-button').getAttribute('aria-pressed') === 'true'`);
  await check('pause stops music too', `document.getElementById('background-music').paused`);
  const frozenTime = await evaluate('window.aarambh.elapsed');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await pause(150);
  assert.equal(await evaluate('window.aarambh.elapsed'), frozenTime, 'Resize preserves paused timeline');
  await check('paused resize repaints particles', `(() => { const c = document.getElementById('light-canvas'); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0); })()`);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.getElementById('pause-button').click()`);
  await pause(8500);
  await check('natural reveal completes every path', `document.getElementById('art-stage').dataset.state === 'revealed' && [...document.querySelectorAll('.draw-path')].every(p => parseFloat(p.style.strokeDashoffset) === 0)`);
  await pause(1500);
  await screenshot('desktop-revealed');
  await evaluate(`document.getElementById('awaken-button').click()`);
  await check('replay resets drawing', `document.getElementById('art-stage').dataset.state === 'revealing' && [...document.querySelectorAll('.draw-path')].some(p => parseFloat(p.style.strokeDashoffset) > 0)`);
  await evaluate(`document.getElementById('skip-button').focus(); document.getElementById('skip-button').click()`);
  await check('skip completes and restores focus', `document.getElementById('art-stage').dataset.state === 'revealed' && document.activeElement.id === 'awaken-button'`);
  await evaluate(`document.getElementById('sound-button').click()`);
  await pause(200);
  await check('music disables', `document.getElementById('sound-button').getAttribute('aria-pressed') === 'false'`);
  await evaluate(`document.getElementById('sound-button').click()`);
  await pause(200);
  await check('music enables', `document.getElementById('sound-button').getAttribute('aria-pressed') === 'true'`);
  await evaluate(`document.getElementById('intention-button').click()`);
  await check('intention opens', `document.getElementById('intention-dialog').open`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await check('intention closes with Escape', `!document.getElementById('intention-dialog').open`);
  await evaluate(`document.getElementById('fullscreen-button').click()`);
  await pause(400);
  await check('fullscreen isolates the artwork', `document.fullscreenElement?.classList.contains('art-section')`);
  await check('fullscreen includes music control', `document.fullscreenElement.contains(document.getElementById('sound-button'))`);
  await screenshot('fullscreen-revealed');
  await evaluate(`document.getElementById('replay-button').click(); document.getElementById('skip-button').click()`);
  await check('fullscreen replay and skip retain accessible controls', `document.activeElement.id === 'replay-button' && document.getElementById('art-stage').dataset.state === 'revealed'`);
  await evaluate(`document.getElementById('fullscreen-button').click()`);
  await pause(200);
  await check('fullscreen exits', `!document.fullscreenElement`);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate();
  await check('mobile has no horizontal overflow', 'document.documentElement.scrollWidth <= innerWidth');
  await screenshot('mobile-idle');
  await evaluate(`document.getElementById('seed-button').click(); document.getElementById('skip-button').click()`);
  await pause(2300);
  await check('mobile brings the scene into view', `document.querySelector('.art-stage').getBoundingClientRect().bottom < innerHeight`);
  await screenshot('mobile-revealed');
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  await check('small mobile has no horizontal overflow', 'document.documentElement.scrollWidth <= innerWidth');
  await screenshot('small-mobile-revealed');
  await evaluate(`document.getElementById('portrait-button').click()`);
  await pause(250);
  await check('reel view fits portrait viewport', `document.body.classList.contains('portrait-view') && document.querySelector('.art-section').getBoundingClientRect().bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth`);
  await screenshot('portrait-revealed');
  await evaluate(`document.getElementById('portrait-button').click()`);
  await check('reel view exits', `!document.body.classList.contains('portrait-view')`);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await navigate();
  await evaluate(`document.getElementById('awaken-button').click()`);
  await check('reduced motion reveals immediately', `document.getElementById('art-stage').dataset.state === 'revealed' && [...document.querySelectorAll('.draw-path')].every(p => parseFloat(p.style.strokeDashoffset) === 0)`);
  assert.deepEqual(errors, [], 'No browser runtime errors');
  assert.deepEqual(networkErrors, [], 'No failed resources');
  console.log('PASS no runtime errors or failed resources');
  fs.writeFileSync(path.join(directory, 'browser-results.json'), JSON.stringify({ passed: true, errors, networkErrors }, null, 2));
  // Chrome can exit before acknowledging Browser.close over its websocket.
  await Promise.race([send('Browser.close'), pause(1000)]);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  clearTimeout(watchdog);
  connection?.close();
  if (!chrome.killed) chrome.kill();
});
