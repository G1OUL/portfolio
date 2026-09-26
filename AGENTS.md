# Base44 development notes

- The active page is `index.html`, which links to `styles.css` and `script.js` (both are now actively loaded via `<link>` and `<script type="module">`).
- The page imports Three.js from unpkg in the browser via an importmap, so the animated 3D terrain background requires network access and WebGL. No API credentials or backend services are needed.
- The 3D scene is a scroll-driven procedural terrain with particles and bloom post-processing (desktop only). Theme toggle switches dark/light colors for both CSS and the Three.js scene.
- Start with `docker compose -f docker-compose.base44.yml up -d --build`; check with `curl http://localhost:3000/`. The static files are bind-mounted and served by live-server for automatic browser reload on edits.
