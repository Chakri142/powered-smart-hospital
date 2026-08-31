const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTS = [8000, 8080, 3000, 5000];
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createServer(portIndex) {
  if (portIndex >= PORTS.length) {
    console.error('Error: Could not find an available port to start the web server.');
    process.exit(1);
  }

  const port = PORTS[portIndex];
  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
    let extname = String(path.extname(filePath)).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Page Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(500);
          res.end('Server Error: ' + error.code, 'utf-8');
        }
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(content, 'utf-8');
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is currently in use. Trying port ${PORTS[portIndex + 1]}...`);
      createServer(portIndex + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, () => {
    console.log('================================================================');
    console.log(` 🚀 PSH Command Center Web Server is Running!`);
    console.log(` 👉 Open your web browser and go to: http://localhost:${port}`);
    console.log('================================================================');
  });
}

createServer(0);
