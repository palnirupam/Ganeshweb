const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const configuredPort = process.env.PORT;
let port = Number(configuredPort || 3000);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('PORT must be an integer between 0 and 65535.');
  process.exit(1);
}

// Automatically find a free port for local development; honor an explicit PORT.
const lastPort = configuredPort ? port : Math.min(port + 20, 65535);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || pathname.split('/').some(part => part.startsWith('.'))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && port < lastPort) {
    console.log(`Port ${port} is busy. Trying ${port + 1}...`);
    port += 1;
    server.listen(port, '127.0.0.1');
    return;
  }

  const message = error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the other server or choose a different PORT.`
    : error.message;
  console.error(`AARAMBH could not start: ${message}`);
  process.exitCode = 1;
});

server.on('listening', () => {
  console.log(`AARAMBH is ready at http://localhost:${server.address().port}`);
});

server.listen(port, '127.0.0.1');
