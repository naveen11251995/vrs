require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.warn(
    '\n[WARN] GOOGLE_MAPS_API_KEY is not set. Copy .env.example to .env and add your key.\n'
  );
}

// Open CORS: this proxy's only job is to re-serve Google's images with
// CORS headers attached so your GitHub Pages frontend (a different origin)
// can use them as WebGL textures.
app.use(cors());

/**
 * Check whether Street View coverage exists near a lat/lng, and get the
 * canonical panorama location Google snaps to.
 * Docs: https://developers.google.com/maps/documentation/streetview/metadata
 */
app.get('/api/streetview-meta', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data); // { status, pano_id, location: {lat, lng}, ... }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Street View metadata' });
  }
});

/**
 * Proxy a single Street View Static image tile (a rectilinear photo at a
 * given heading/pitch/fov, NOT a full equirectangular pano). The client
 * requests several of these and stitches them into an approximate sphere
 * texture. This keeps the API key server-side.
 * Docs: https://developers.google.com/maps/documentation/streetview/request-streetview
 */
app.get('/api/streetview-tile', async (req, res) => {
  const { lat, lng, heading = 0, pitch = 0, fov = 90, size = '640x640' } = req.query;
  if (!lat || !lng) return res.status(400).send('lat and lng are required');

  try {
    const url =
      `https://maps.googleapis.com/maps/api/streetview` +
      `?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${API_KEY}`;
    const r = await fetch(url);
    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    r.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch Street View tile');
  }
});

/**
 * Proxy a flat Static Map image (used as the in-VR mini-map texture),
 * with a marker at the user's current position.
 * Docs: https://developers.google.com/maps/documentation/maps-static
 */
app.get('/api/minimap', async (req, res) => {
  const { lat, lng, zoom = 17, size = '400x400' } = req.query;
  if (!lat || !lng) return res.status(400).send('lat and lng are required');

  try {
    const url =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${lat},${lng}&zoom=${zoom}&size=${size}` +
      `&markers=color:red%7C${lat},${lng}&key=${API_KEY}`;
    const r = await fetch(url);
    res.set('Content-Type', r.headers.get('content-type') || 'image/png');
    r.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch mini-map image');
  }
});

app.listen(PORT, () => {
  console.log(`VR 360 Maps Explorer server running at http://localhost:${PORT}`);
});
