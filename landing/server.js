import express from 'express';
import {GameDig} from 'gamedig';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

// Serve static assets (place your tile image at landing/public/tile.png)
app.use(express.static('public'));

// Discover tile images in public/tiles (optional)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let tileFiles = [];
try {
  const tilesDir = path.join(__dirname, 'public', 'tiles');
  tileFiles = fs.readdirSync(tilesDir)
    .filter((f) => /\.(png|jpe?g|gif)$/i.test(f))
    .map((f) => `/tiles/${f}`);
} catch (e) {
  tileFiles = [];
}

const defaultServers = [
  { name: 'FFA', host: 'quake1', port: 27960 },
  { name: 'CTF', host: 'quake2', port: 27960 },
  { name: 'Q3TA', host: 'quake3', port: 27960 },
];

let servers;
try {
  servers = JSON.parse(process.env.SERVERS_JSON || 'null') || defaultServers;
} catch (error) {
  console.warn('Invalid SERVERS_JSON provided. Falling back to defaults.', error.message);
  servers = defaultServers;
}

async function fetchStatus(server) {
  try {
    const state = await GameDig.query({
      type: 'q3a',
      host: server.host,
      port: server.port,
      socketTimeout: 1000,
      givenPortOnly: true,
      debug: false,
      maxAttempts: 1,
    });

    return {
      ...server,
      online: true,
      hostname: state.name || server.name,
      map: state.map,
      players: state.players.length,
      maxPlayers: state.maxplayers,
      motd: state.raw?.rules?.g_motd || '',
    };
  } catch (error) {
    return {
      ...server,
      online: false,
      error: error.message,
    };
  }
}

function renderHtml(statuses) {
  const rows = statuses
    .map((status, index) => {
      const zebra = index % 2 === 0 ? '#1a1a1a' : '#111';
      const badgeColor = status.online ? '#5dfc5d' : '#ff5e5e';
      const badgeText = status.online ? 'ONLINE' : 'OFFLINE';
      const detail = status.online
        ? `${status.players}/${status.maxPlayers} players — Map: ${status.map}`
        : status.error || 'No response';

      return `
        <tr style="background:${zebra};">
          <td style="padding:12px 16px; border:1px solid #333;">
            <div style="font-weight:bold; letter-spacing:2px; color:#ffdd57;">${status.name}</div>
            <div style="font-size:12px; color:#aaa;">${status.host.replace(/^quake[0-9]/, 'quake.pklan.net')}:${status.displayPort || status.port}</div>
          </td>
          <td style="padding:12px 16px; border:1px solid #333; color:#ddd;">
            ${detail}
          </td>
          <td style="padding:12px 16px; border:1px solid #333; text-align:center;">
            <span style="display:inline-block; padding:6px 12px; border:1px solid #333; background:${badgeColor}; color:#111; font-weight:bold; min-width:90px;">${badgeText}</span>
          </td>
        </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>QUAKE:PKLAN:NET</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body {
    margin: 0;
    font-family: 'Verdana', 'Geneva', sans-serif;
    background-color: #000;

    color: #f9f9f9;
  }
  .scanlines {
    position: fixed;
    inset: 0;
    background-image: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%);
    background-size: 100% 2px;
    pointer-events: none;
    opacity: 0.35;
  }
  .wrapper {
    max-width: 960px;
    margin: 40px auto;
    padding: 16px;
    background: rgba(10, 10, 10, 0.85);
    border: 4px double #ffae00;
    box-shadow: 0 0 40px rgba(0,0,0,0.8);
  }
  .logo {
    text-align: center;
    margin-bottom: 12px;
  }
  .logo img {
    max-width: 220px;
    height: auto;
    display: inline-block;
  }
  h1 {
    font-size: 48px;
    text-align: center;
    letter-spacing: 6px;
    color: #ffae00;
    text-shadow: 0 0 12px rgba(255, 174, 0, 0.7);
    margin-bottom: 6px;
  }
  .subtitle {
    text-align: center;
    font-size: 12px;
    letter-spacing: 0.6em;
    color: #aaa;
    margin-bottom: 24px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
</style>
</head>
<body>
<div id="bg-layers" aria-hidden="true"></div>
<div class="scanlines"></div>
<div class="wrapper">
  <div class="logo"><img src="/logo.png" alt="QUAKE:PKLAN:NET logo"/></div>
  <h1>QUAKE:PKLAN:NET</h1>
  <div class="subtitle">THE PORTAL OF PERMANENT DEATH</div>
  <table>
    <tbody>
      ${rows}
    </tbody>
  </table>
</div>
</body>
<script>
  (function(){
    const tiles = ${JSON.stringify(tileFiles)};
    if(!tiles || tiles.length === 0) return;

    const container = document.getElementById('bg-layers');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.zIndex = '-1';
    container.style.pointerEvents = 'none';

    const CELL = 64; // grid cell size in px (adjust for larger/smaller tiles)

    function buildGrid() {
      container.innerHTML = '';
      const w = Math.max(window.innerWidth, 1);
      const h = Math.max(window.innerHeight, 1);
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = document.createElement('div');
          el.className = 'bg-cell';
          el.style.position = 'absolute';
          el.style.left = (c * CELL) + 'px';
          el.style.top = (r * CELL) + 'px';
          el.style.width = CELL + 'px';
          el.style.height = CELL + 'px';
          const src = tiles[Math.floor(Math.random() * tiles.length)];
          el.style.backgroundImage = 'url(' + src + ')';
          el.style.backgroundRepeat = 'no-repeat';
          el.style.backgroundSize = 'cover';
          el.style.opacity = 0.98;
          el.dataset.speed = (0.2 + Math.random() * 1.2).toString();
          el.dataset.phase = (Math.random() * Math.PI * 2).toString();
          container.appendChild(el);
        }
      }
    }

    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(buildGrid, 150);
    });

    buildGrid();

    let last = performance.now();
    function tick(now) {
      last = now;
      const t = now / 1000;
      document.querySelectorAll('.bg-cell').forEach((el) => {
        const speed = parseFloat(el.dataset.speed) || 0.6;
        const phase = parseFloat(el.dataset.phase) || 0;
        const ampX = 6 * speed;
        const ampY = 4 * speed;
        const x = Math.sin(t * (0.6 + speed * 0.2) + phase) * ampX;
        const y = Math.cos(t * (0.5 + speed * 0.15) + phase) * ampY;
        el.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();
</script>
</html>`;
}

app.get('/', async (_req, res) => {
  const statuses = await Promise.all(servers.map((server) => fetchStatus(server)));
  res.set('Cache-Control', 'no-store');
  res.send(renderHtml(statuses));
});

app.get('/status.json', async (_req, res) => {
  const statuses = await Promise.all(servers.map((server) => fetchStatus(server)));
  res.json(statuses);
});

app.listen(port, () => {
  console.log(`Landing page up on port ${port}`);
});
