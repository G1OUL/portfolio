# Base44 development notes

- The active page is `index.html`; `styles.css` and `script.js` are leftover files not loaded by that page.
- The page imports Three.js from unpkg in the browser, so its animated background requires network access and WebGL. No API credentials or backend services are needed.
- Start with `docker compose -f docker-compose.base44.yml up -d --build`; check with `curl http://localhost:3000/`. The static files are bind-mounted and served by live-server for automatic browser reload on edits.
