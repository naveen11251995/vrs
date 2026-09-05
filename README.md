# 🥽 VR 360° Street-View Explorer (Meta Quest 3 + Google Maps)

An immersive WebXR application designed for the Meta Quest Browser that lets users explore real-world locations as full 360° panoramas with Google Street View-style navigation, live 2D mini-map tracking overlay, landmark teleporter, and 6DoF VR controller interactions.

---

## ✨ Features

- **🌐 Immersive 360° Panorama Sphere**: Equirectangular textures rendered on an inverted 180m skydome.
- **🧭 Street View-Style Hotspot Navigation**: 3D floating directional arrows rendered at exact cardinal/heading angles with smooth camera transitions and spatial audio feedback.
- **🗺️ Live 2D Mini-Map Panel**: Floating HUD overlay in VR tracking real-time latitude/longitude, map grid, pin marker, and yellow view directional cone.
- **📍 Landmark Teleporter**: Instant teleportation to iconic world destinations:
  - 🇦🇪 *Abu Dhabi Corniche & Sheikh Zayed Grand Mosque*
  - 🇦🇪 *Burj Khalifa & Downtown Dubai*
  - 🇦🇪 *Emirates Palace Abu Dhabi*
  - 🇫🇷 *Eiffel Tower, Paris*
  - 🇺🇸 *Times Square, NYC & Grand Canyon*
  - 🇯🇵 *Shibuya Crossing, Tokyo*
- **🎮 Full Meta Quest Controller Support**:
  - **Cyan Laser Pointer + Trigger**: Select navigation arrows or teleport landmarks.
  - **Left Thumbstick**: Smooth locomotion / translation movement in 3D space.
  - **Right Thumbstick**: Snap rotation (45° view angle increments).
  - **Grip Button**: Toggle mini-map HUD visibility.
- **🖼️ Custom Photo Upload Mode**: Drag-and-drop or upload custom equirectangular panoramas with manual hotspot link definitions.

---

## 🛠️ Tech Stack

- **3D / WebXR Engine**: Three.js (r128) + WebXR Device API
- **Maps Platform**: Google Maps JavaScript API & StreetViewService proxy
- **Backend**: Express.js proxy server (`server.js`)
- **Hosting**: GitHub Pages (HTTPS mandatory for WebXR context)

---

## 🚀 Quick Deployment to GitHub Pages

1. Create a repository on GitHub (e.g. `street-view-vr`).
2. Upload all files from this directory:
   - `index.html`
   - `three.min.js`
   - `server.js`
   - `.nojekyll`
   - `README.md`
3. Go to **Settings > Pages** in your GitHub repository.
4. Set the **Source** branch to `main` and folder to `/ (root)`.
5. Open `https://<your-username>.github.io/<repo-name>/` in your **Meta Quest 3 Browser** and click **ENTER VR**.
