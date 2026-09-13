const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const children = [];

function launch(port) {
  const env = { ...process.env };
  delete env.PORT;
  if (port !== undefined) env.PORT = String(port);
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env, windowsHide: true });
  children.push(child);
  let stdout = '', stderr = '';
  let settled = false;
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Startup timed out')), 8000);
    child.stdout.on('data', data => {
      stdout += data;
      const match = stdout.match(/AARAMBH is ready at (http:\/\/localhost:(\d+))/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ url: match[1], port: Number(match[2]), stdout });
      }
    });
    child.stderr.on('data', data => stderr += data);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => {
      clearTimeout(timer);
      if (!settled) resolve({ code, stdout, stderr });
    });
  });
  return { child, ready };
}

(async () => {
  const first = await launch().ready;
  assert.ok(first.url);
  const second = await launch().ready;
  assert.ok(second.port > first.port, 'Second server finds a different port');
  assert.match(second.stdout, /is busy\. Trying/);
  for (const running of [first, second]) {
    const response = await fetch(running.url);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /AARAMBH/);
  }
  console.log(`PASS concurrent servers serve the site on ${first.port} and ${second.port}`);
  const fixed = await launch(first.port).ready;
  assert.equal(fixed.code, 1);
  assert.match(fixed.stderr, /already in use/);
  assert.doesNotMatch(fixed.stderr, /Unhandled/);
  console.log('PASS explicit occupied PORT fails with a clear message');
  const invalid = await launch('invalid').ready;
  assert.equal(invalid.code, 1);
  assert.match(invalid.stderr, /must be an integer/);
  console.log('PASS invalid PORT is handled');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  for (const child of children) if (child.exitCode === null) child.kill();
});
