# Copilot Instructions for ioq3-server

## Project Overview
- This repository builds and runs a dedicated ioquake3 game server in Docker, supporting multiple server modes (FFA, CTF, Missionpack) via Docker Compose.
- The main entrypoint is `files/entrypoint.sh`, which copies configs, sets up environment variables, and launches the server binary.
- Game assets (.pk3 files) are stored in `baseq3/` and `missionpack/` (not included in repo; user must provide `pak0.pk3`).
- All server configs are managed in the `configs/` directory and copied into the game directory at container startup.

- **Build Process:**
  - Multi-stage Docker build (see `Dockerfile`) fetches ioquake3 source from GitHub and builds only the dedicated server binary for minimal image size.
- **Startup Workflow:**
  - On container start, `entrypoint.sh` copies configs from `/opt/quake3/configs` to `/opt/quake3/baseq3`, sets up environment variables, and launches the server.
  - Each server instance is configured via `SERVER_ARGS` (e.g., `+exec server-ffa.cfg`).
  - When `FASTDL_URL` is set, `entrypoint.sh` also injects `sv_allowDownload`/`sv_dlURL` flags.
  - Game data is mounted read-only; configs are editable and persistent.

- **Build:** `docker compose build` (or `docker build -t ioq3-server .`)
- **Run:** `docker compose up` (spins up multiple server instances plus the `fastdl` HTTP service)
- **Landing Page:** `landing` service (Node/Express) is part of the same compose stack; configure displayed servers via `SERVERS_JSON` env in `docker-compose.yml`.
- **Config Management:** Place/edit configs in `configs/` (e.g., `server-ffa.cfg`, `server-ctf.cfg`, `server-mp.cfg`). These are copied into the game directory at startup.
- **Game Data:** User must manually add `pak0.pk3` to `baseq3/` and `missionpack/` (not tracked in git; see `.gitignore`).
- **Fast Downloads:** `fastdl` (nginx) serves `.pk3` files over HTTP; set `FASTDL_URL` to the public base URL.
- **Debugging:** Logs go to stdout. Entrypoint prints diagnostics if the server binary is missing or ambiguous.

## Project-Specific Patterns
- Always runs as non-root user (`ioq3ded`) for security.
- Only the dedicated server binary is present in the final image.
- Game data is mounted read-only; configs are mounted read-write and copied at startup.
- Environment variables (`SERVER_ARGS`, `SERVER_MOTD`, `ADMIN_PASSWORD`) control server behavior.
- Entrypoint script generates a random admin password if not provided.

## Key Files & Directories
- `Dockerfile`: Multi-stage build, fetches ioquake3 source, builds dedicated server.
- `docker-compose.yml`: Multi-instance orchestration (FFA, CTF, Missionpack).
- `files/entrypoint.sh`: Startup logic, config management.
- `baseq3/`, `missionpack/`: Game asset storage (user-supplied .pk3 files).
- `configs/`: All server configs (editable, copied into baseq3 at startup).
- `fastdl/nginx.conf`: Nginx autoindex config for HTTP fast downloads, serving only files placed in `fastdl/public/`.
- `fastdl/public/`: Staging area for publicly downloadable custom pk3 files (keep official `pak0.pk3` out of here).
- `landing/`: Node/Express retro status page queried via UDP (`gamedig`), served on port 8081 by default.

## External Dependencies
- Alpine Linux, ioquake3 source (GitHub), standard build tools (git, curl, gcc, cmake, ninja).
- No external service integration; all logic is self-contained in the container.

---

**Review and update this file as project conventions evolve. If any section is unclear or missing, please provide feedback for improvement.**
