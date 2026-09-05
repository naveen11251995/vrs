const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Proxy endpoint for Google Street View API metadata
  if (pathname === '/api/panorama') {
    const { lat, lng } = parsedUrl.query;

    if (!lat || !lng) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing required parameters: lat, lng' }));
    }

    if (!GOOGLE_MAPS_API_KEY) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'MOCK_DATA',
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        panoId: `pano_${parseFloat(lat).toFixed(4)}_${parseFloat(lng).toFixed(4)}`,
        links: [
          { heading: 0, description: 'North Boulevard', panoId: 'pano_north' },
          { heading: 90, description: 'East Avenue', panoId: 'pano_east' },
          { heading: 180, description: 'South Drive', panoId: 'pano_south' },
          { heading: 270, description: 'West Way', panoId: 'pano_west' }
        ]
      }));
    }

    const apiUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    https.get(apiUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => { data += chunk; });
      apiRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Static file serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end(`Server Error: ${readErr.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.log(`⚠️ Port ${PORT} in use, trying http://localhost:${nextPort}...`);
    server.listen(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🌐 VR 360° Street-View Explorer Zero-Dep Server running!`);
  console.log(` 📍 Local URL: http://localhost:${PORT}`);
  console.log(` 🥽 Meta Quest WebXR requires HTTPS (e.g. GitHub Pages or ngrok)`);
  console.log(`=======================================================`);
});
