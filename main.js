import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------------------------------------------------------------------------
// Scene / renderer / camera rig
// ---------------------------------------------------------------------------

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// "dom-overlay" keeps the #ui panel (map, buttons, status) visible as a 2D
// overlay while inside the VR session on the Quest Browser.
document.body.appendChild(
  VRButton.createButton(renderer, {
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.getElementById('ui') },
  })
);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableZoom = false;
orbit.enablePan = false;
orbit.rotateSpeed = -0.4;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// Panorama sphere — only ever loaded from same-origin assets or local
// uploads (blob URLs), so there are no WebGL/CORS texture issues.
// ---------------------------------------------------------------------------

const sphereGeometry = new THREE.SphereGeometry(50, 64, 64);
sphereGeometry.scale(-1, 1, 1);
const sphereMaterial = new THREE.MeshBasicMaterial();
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphereMesh);

const textureLoader = new THREE.TextureLoader();

// The list of panoramas the user can cycle through with the VR trigger.
// Starts with the bundled sample; uploaded photos get appended.
const panoramas = [{ name: 'Sample panorama', url: 'assets/sample-panorama.jpg' }];
let currentPanoramaIndex = 0;

function applyPanorama(index) {
  const pano = panoramas[index];
  currentPanoramaIndex = index;

  if (pano.texture) {
    // Already-built texture (e.g. a stitched Street View canvas) — apply directly.
    sphereMaterial.map = pano.texture;
    sphereMaterial.needsUpdate = true;
    setStatus(`Viewing: ${pano.name}`);
    return;
  }

  textureLoader.load(pano.url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    sphereMaterial.map = texture;
    sphereMaterial.needsUpdate = true;
    setStatus(`Viewing: ${pano.name}`);
  });
}

applyPanorama(0);

document.getElementById('photoUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  panoramas.push({ name: file.name, url });
  applyPanorama(panoramas.length - 1);
});

function cycleToNextPanorama() {
  applyPanorama((currentPanoramaIndex + 1) % panoramas.length);
}

// ---------------------------------------------------------------------------
// VR controllers: trigger = next photo, thumbstick = snap turn,
// grip = recenter view
// ---------------------------------------------------------------------------

const controllerModelFactory = new XRControllerModelFactory();

function setupController(index) {
  const controller = renderer.xr.getController(index);
  rig.add(controller);

  const grip = renderer.xr.getControllerGrip(index);
  grip.add(controllerModelFactory.createControllerModel(grip));
  rig.add(grip);

  controller.addEventListener('selectstart', cycleToNextPanorama);
  controller.addEventListener('squeezestart', () => {
    rig.rotation.y = 0;
  });
}

setupController(0);
setupController(1);

let lastSnapTurnTime = 0;
const SNAP_TURN_COOLDOWN_MS = 350;
const SNAP_TURN_DEGREES = 30;

function pollThumbsticksForSnapTurn() {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const source of session.inputSources) {
    if (!source.gamepad) continue;
    const axes = source.gamepad.axes;
    const x = axes.length >= 4 ? axes[2] : axes[0];
    if (Math.abs(x) > 0.7) {
      const now = performance.now();
      if (now - lastSnapTurnTime > SNAP_TURN_COOLDOWN_MS) {
        rig.rotation.y += THREE.MathUtils.degToRad(SNAP_TURN_DEGREES) * (x > 0 ? -1 : 1);
        lastSnapTurnTime = now;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Optional client-side Google Maps (2D only — never touches the WebGL
// sphere, so no CORS/texture problem). Uses whatever key the user pastes
// in; nothing is bundled or committed to the repo.
// ---------------------------------------------------------------------------

let mapsLoaded = false;
let map, marker, streetViewService;

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (mapsLoaded) return resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.onload = () => {
      mapsLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensureMapsReady() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) {
    setStatus('Paste a Google Maps API key first (restricted to your GitHub Pages domain).');
    return false;
  }
  if (!mapsLoaded) {
    setStatus('Loading Google Maps...');
    await loadGoogleMapsScript(apiKey);
  }
  if (!map) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 40.758, lng: -73.9855 },
      zoom: 15,
      disableDefaultUI: true,
    });
    marker = new google.maps.Marker({ map });
    streetViewService = new google.maps.StreetViewService();
    map.addListener('click', (e) => {
      document.getElementById('lat').value = e.latLng.lat().toFixed(6);
      document.getElementById('lng').value = e.latLng.lng().toFixed(6);
    });
  }
  return true;
}

document.getElementById('checkStreetView').addEventListener('click', async () => {
  const ready = await ensureMapsReady();
  if (!ready) return;

  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    setStatus('Enter valid numeric coordinates.');
    return;
  }

  map.setCenter({ lat, lng });
  marker.setPosition({ lat, lng });

  streetViewService.getPanorama({ location: { lat, lng }, radius: 50 }, (data, status) => {
    const preview = document.getElementById('streetViewPreview');
    if (status !== 'OK') {
      preview.removeAttribute('src');
      setStatus(`No Street View coverage there (status: ${status}).`);
      return;
    }
    const apiKey = document.getElementById('apiKey').value.trim();
    const snapped = data.location.latLng;
    preview.src =
      `https://maps.googleapis.com/maps/api/streetview` +
      `?size=400x300&location=${snapped.lat()},${snapped.lng()}&key=${encodeURIComponent(apiKey)}`;
    setStatus(
      `Street View found at ${snapped.lat().toFixed(6)}, ${snapped.lng().toFixed(6)} ` +
        `(2D preview only — see the hint below).`
    );
  });
});

// ---------------------------------------------------------------------------
// Loading real Street View INTO the VR sphere. This requires the small
// backend proxy (see README) — it re-serves Google's images from the same
// origin as the proxy, with CORS headers attached, which is what lets
// WebGL treat the stitched result as a valid texture instead of tainting
// the canvas.
// ---------------------------------------------------------------------------

function loadProxyImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function fetchStreetViewComposite(proxyBase, lat, lng) {
  const headings = [0, 60, 120, 180, 240, 300];
  const rows = [40, 0, -40];
  const tileW = 512;
  const tileH = 512;

  const canvas = document.createElement('canvas');
  canvas.width = tileW * headings.length;
  canvas.height = tileH * rows.length;
  const ctx = canvas.getContext('2d');

  for (let r = 0; r < rows.length; r++) {
    const pitch = rows[r];
    for (let c = 0; c < headings.length; c++) {
      const heading = headings[c];
      const url =
        `${proxyBase}/api/streetview-tile?lat=${lat}&lng=${lng}` +
        `&heading=${heading}&pitch=${pitch}&fov=70&size=${tileW}x${tileH}`;
      // eslint-disable-next-line no-await-in-loop
      const img = await loadProxyImage(url);
      ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH);
    }
  }
  return canvas;
}

document.getElementById('loadIntoVR').addEventListener('click', async () => {
  const proxyBase = document.getElementById('proxyUrl').value.trim().replace(/\/$/, '');
  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);

  if (!proxyBase) {
    setStatus('Paste your deployed backend proxy URL first (see README).');
    return;
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    setStatus('Enter valid numeric coordinates.');
    return;
  }

  try {
    setStatus('Checking coverage via proxy...');
    const metaRes = await fetch(`${proxyBase}/api/streetview-meta?lat=${lat}&lng=${lng}`);
    const meta = await metaRes.json();
    if (meta.status !== 'OK') {
      setStatus(`No Street View coverage there (status: ${meta.status}).`);
      return;
    }

    setStatus('Stitching panorama for the VR sphere...');
    const canvas = await fetchStreetViewComposite(proxyBase, meta.location.lat, meta.location.lng);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    panoramas.push({
      name: `Street View ${meta.location.lat.toFixed(4)}, ${meta.location.lng.toFixed(4)}`,
      texture,
    });
    applyPanorama(panoramas.length - 1);
    setStatus('Loaded Street View into the VR sphere (approximate stitch — expect seams).');
  } catch (err) {
    console.error(err);
    setStatus('Failed to load from the proxy — check the URL and that the server is running.');
  }
});

// ---------------------------------------------------------------------------
// UI + render loop
// ---------------------------------------------------------------------------

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

renderer.setAnimationLoop(() => {
  pollThumbsticksForSnapTurn();
  orbit.update();
  renderer.render(scene, camera);
});
