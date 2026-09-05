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

## Want live Street View *inside* the headset?
That needs a small same-origin proxy so the images arrive with the right
CORS headers. A minimal Node/Express version of that proxy (deployable free
on Render/Railway, separate from this static site) is available — say the
word and it can be added back in, with `main.js` here updated to fetch
sphere textures from that proxy's URL instead of local files.
