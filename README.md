# ioq3-server: Easy ioquake3 Dedicated Server with Docker Compose

![Quake 3 Arena](https://upload.wikimedia.org/wikipedia/en/0/0c/Quake3Title.png)

## 🚀 Quick Start

1. **Clone this repository:**
   ```sh
   git clone https://github.com/yourname/ioq3-server.git
   cd ioq3-server
   ```
2. **Add your Quake 3 game data:**
  - Place your `pak0.pk3` (and optionally other .pk3 files) in the `baseq3/` directory.
  - For Team Arena, add .pk3 files to `missionpack/`.
  - ⚠️ **pak0.pk3 is not included in this repository due to copyright. You must provide your own.**
  - `.gitignore` is set to exclude pak0.pk3 files for safety.
  - Optional: drop non-standard/custom maps into both `baseq3/` (so the server can load them) **and** `fastdl/public/baseq3/` (so clients can download them). Team Arena customs go into the matching `missionpack/` folders.
3. **Build and launch multiple servers:**
   ```sh
   docker compose up --build
   ```
   - This will start three server instances (see `docker-compose.yml`).
  - Each instance uses its own config and port (27960, 27961, 27962) plus:
    - `fastdl` on port 8080 for HTTP map downloads.
    - `landing` on port 8081 serving an old-school server status page.

## 🛠️ Configuration
- **Configs:** Place all your server configs (e.g. `server-ffa.cfg`, `server-ctf.cfg`, `server-mp.cfg`) in the `configs/` directory. Each server instance uses its own config via the `SERVER_ARGS` environment variable.
- **Environment Variables:**
  - `SERVER_ARGS` (e.g. `+exec server-ffa.cfg`)
  - `SERVER_MOTD` (server message)
  - `ADMIN_PASSWORD` (RCON password, auto-generated if unset)
  - `FASTDL_URL` (public HTTP(S) base path for map downloads; defaults to `http://localhost:8080` in `docker-compose.yml`)
- **Volumes:**
  - Game data in `baseq3/` is persisted and shared between instances (mounted read/write so configs can be copied at startup).
  - Configs in `configs/` are editable and copied into the game directory at startup.
  - Fast-download assets live in `fastdl/public/` and are served read-only by Nginx. Only place files there that you want the public to fetch (avoid official pak0.pk3).

## 🐳 Docker Compose Example
```yaml
services:
  quake1:
    build: .
    image: ioq3-server
    container_name: quake1
    ports:
      - "27960:27960/udp"
    volumes:
      - ./baseq3:/opt/quake3/baseq3
      - ./configs:/opt/quake3/configs
    environment:
      - SERVER_ARGS=+exec server-ffa.cfg
  quake2:
    build: .
    image: ioq3-server
    container_name: quake2
    ports:
      - "27961:27960/udp"
    volumes:
      - ./baseq3:/opt/quake3/baseq3
      - ./configs:/opt/quake3/configs
    environment:
      - SERVER_ARGS=+exec server-ctf.cfg
  quake3:
    build: .
    image: ioq3-server
    container_name: quake3
    ports:
      - "27962:27960/udp"
    volumes:
      - ./baseq3:/opt/quake3/baseq3
      - ./configs:/opt/quake3/configs
    environment:
      - SERVER_ARGS=+exec server-mp.cfg
      - FASTDL_URL=http://localhost:8080

  fastdl:
    image: nginx:1.27-alpine
    container_name: fastdl
    ports:
      - "8080:80"
    volumes:
      - ./fastdl/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./fastdl/public:/usr/share/nginx/html:ro
```

## ⚡ Fast Download Server
- `fastdl` is an Nginx container that serves the contents of `baseq3/` and `missionpack/` over HTTP with directory listings enabled.
- Update `FASTDL_URL` to match your public hostname (e.g., `http://cdn.example.com`) so clients can fetch custom maps quickly.
- Open port 8080 (or your remapped port) on your firewall/CDN if you want players outside your LAN to use fast downloads.
- Files remain read-only inside the container, preventing accidental deletion.
- Only copy non-standard maps into `fastdl/public/baseq3` or `fastdl/public/missionpack` so official assets like `pak0.pk3` are never exposed publicly.

## 🖥️ Retro Landing Page
- `landing` is a Node/Express app (port 8081) that queries each server via UDP and renders a 90s-style table showing online/offline state, map, and player counts.
- Configure displayed servers via the `SERVERS_JSON` environment variable in `docker-compose.yml` (defaults target the bundled `quake1-3` services).
- The Go old-school aesthetic uses table layouts, tiled backgrounds, and scanlines—tweak `landing/server.js` to change styling or add more metadata.
- Expose port 8081 publicly (or behind a reverse proxy) for visitors to see live status; `/status.json` provides machine-readable output for other tools.

## 🔒 Security
- Runs as non-root user (`ioq3ded`) inside the container.
- Only the dedicated server binary is included in the final image.

## 🧩 Advanced Usage
- **Change ioquake3 version:**
  ```sh
  docker build --build-arg IOQUAKE3_COMMIT=release-1.36 -t ioq3-server .
  ```
- **Custom configs:** Mount your own config directory or edit `files/default-configs/`.
- **Multiple servers:** Add more services in `docker-compose.yml` as needed.

## 📂 Key Files & Directories
- `Dockerfile` — Automated build, fetches ioquake3 source from GitHub
- `docker-compose.yml` — Multi-instance orchestration
- `files/entrypoint.sh` — Startup logic, config management
- `baseq3/`, `missionpack/` — Game assets (pak files, not included)
- `configs/` — All server configs (editable, copied into baseq3 at startup)
- `files/default-configs/` — Default server configs

## 🙋 FAQ
- **Q: Why do I need to provide `pak0.pk3`?**
  - A: Due to licensing, you must supply your own Quake 3 data files. pak0.pk3 is not included in this repository and must be added manually.
- **Q: How do I connect?**
  - A: Use your server's IP and the mapped port (e.g., `quake3://your-ip:27960`).
- **Q: How do I set the RCON password?**
  - A: Set the `ADMIN_PASSWORD` environment variable or let it auto-generate.

## 📜 License
- This project automates ioquake3 server deployment. Quake 3 data files are not included.
- See [ioquake3 license](https://github.com/ioquake/ioq3/blob/master/COPYING.txt) for engine details.

---

> Made with ❤️ for easy Quake 3 server hosting. Frag on!
