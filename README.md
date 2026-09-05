# WebXR 360° Explorer — static, GitHub Pages ready

A pure static WebXR site (no backend, no build step) you can push straight
to a GitHub repo and serve with GitHub Pages. Works out of the box with a
bundled sample 360 photo, lets you upload your own, and includes an
*optional* client-side Google Maps panel for picking real-world coordinates
and previewing Street View coverage.

## Why this version has no backend
GitHub Pages only serves static files — it can't run a server. That's fine
for the 360 viewer itself (photos load directly from the repo or from your
local file upload, both same-origin, no issues). It does mean one thing
**can't** work here: pulling live Street View imagery into the WebXR sphere.
Google's Street View/Static Maps image endpoints don't send the CORS headers
WebGL requires to use an image as a texture — that only works when a
same-origin server proxies the image for you (see "Want live Street View in
the headset?" below).

What *does* work fully statically:
- The WebXR 360 sphere, with the bundled sample photo and any photo you
  upload (drag-and-drop your own equirectangular JPG/PNG).
- An interactive, clickable Google Map for picking coordinates.
- A 2D Street View coverage check and preview image shown in the UI panel
  (not in the headset view) — good for confirming a spot has coverage
  before you go photograph it yourself for the VR sphere.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (root of the repo, or a `/docs` folder
   — either works, just match your Pages settings).
2. In the repo: **Settings → Pages → Source**, pick the branch/folder this
   code lives in, save.
3. GitHub gives you a `https://<username>.github.io/<repo>/` URL —
   already HTTPS, which is exactly what WebXR requires. Open it in the
   Quest Browser and click **Enter VR**.

No build step, no environment variables, no server to keep running.

## Using the optional Google Maps panel
1. Get a Google Maps API key in Google Cloud Console, enable the **Maps
   JavaScript API** and **Street View Static API**.
2. **Restrict the key** (HTTP referrers) to your `github.io` URL — since
   this is a static site, the key lives in the browser, so restriction is
   your only protection against misuse.
3. Paste the key into the "Your Google Maps API key" field in the app. It's
   only kept in that page load — nothing is saved to the repo.

## Controls (in VR)
| Input | Action |
|---|---|
| Trigger | Cycle to the next loaded photo |
| Thumbstick left/right | Snap-turn 30° |
| Grip | Recenter your view forward |

The whole UI panel (map, buttons, status) stays visible inside the headset
too, via the WebXR `dom-overlay` feature.

## Getting live Street View *inside* the headset

The repo now includes `backend-proxy/` — a tiny Node/Express server whose
only job is to re-serve Google's Street View images with CORS headers
attached, which is what lets the browser use them as a WebGL texture
instead of blocking them as a security risk. It's deployed separately from
this static site (GitHub Pages can't run it).

1. **Deploy the proxy** (Render, Railway, Fly.io — all have free tiers):
   - Point the host at the `backend-proxy/` folder.
   - Build command: `npm install`. Start command: `npm start`.
   - In the host's dashboard, set the environment variable
     `GOOGLE_MAPS_API_KEY` to your key (this keeps it server-side and out of
     GitHub — a *second*, separate key from the one you paste into the
     browser UI is fine, or reuse the same one).
   - The host gives you a URL like `https://your-app.onrender.com`.

2. **Connect it in the app**: open the "Google Maps" section, enter
   coordinates, and paste that proxy URL into "Backend proxy URL." Click
   **"Load this Street View into the VR sphere."**

3. It stitches several Street View Static images into an approximate 360
   texture and applies it to the sphere — expect visible seams, since this
   is a composite of separate photos, not a true seamless panorama. The
   trigger button now cycles through it alongside your sample/uploaded
   photos.

The 2D "Check Street View coverage" preview still works independently with
just your browser-side key — no proxy needed for that part.
