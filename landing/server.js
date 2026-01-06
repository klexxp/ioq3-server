import express from 'express';
import {GameDig} from 'gamedig';

const app = express();
const port = process.env.PORT || 3000;

const defaultServers = [
  { name: 'FFA Arena', host: 'quake1', port: 27960 },
  { name: 'CTF Grounds', host: 'quake2', port: 27960 },
  { name: 'Missionpack Siege', host: 'quake3', port: 27960 },
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
            <div style="font-size:12px; color:#aaa;">${status.host}:${status.port}</div>
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
    background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23000000"/%3E%3Cpath d="M0 32h64v1H0zm32-32h1v64h-1z" fill="%230b0b0b"/%3E%3C/svg%3E');
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
<div class="scanlines"></div>
<div class="wrapper">
  <h1>QUAKE:PKLAN:NET</h1>
  <div class="subtitle">MULTI-SERVER CONTROL MATRIX</div>
  <table>
    <tbody>
      ${rows}
    </tbody>
  </table>
</div>
</body>
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
