// Deterministic visual-regression capture via headless Chrome CDP.
// usage: node tools/visual-regression/capture.mjs <outDir> [baseUrl]
// Requires Google Chrome (path below) and a local static server, e.g. python -m http.server 8765
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://127.0.0.1:8765/';
mkdirSync(OUT, { recursive: true });
const profile = join(OUT, '..', 'vr-profile-' + Date.now());
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--disable-gpu', '--font-render-hinting=none', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const log = [];
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else {
  if (d.method === 'Runtime.exceptionThrown') log.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') log.push('ERR ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
  if (d.method === 'Network.responseReceived' && d.params.response.status >= 400) log.push('HTTP ' + d.params.response.status + ' ' + d.params.response.url);
} });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result?.result?.value; };
await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable'); await send('Page.enable');
await send('Network.setBlockedURLs', { urls: ['*googletagmanager.com*', '*google-analytics.com*'] });
await send('Network.setCacheDisabled', { cacheDisabled: true });

const TEST_CSS = `.wow{visibility:visible!important;animation:none!important;-webkit-animation:none!important}*,*::before,*::after{transition:none!important;-webkit-transition:none!important}.banner-cell .mouse:after{animation:none!important;-webkit-animation:none!important}`;

async function load(w, h, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: BASE });
  await sleep(2500);
  // scroll through the page so lazy images load, then back to top
  await ev(`(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); })()`);
  await ev(`Promise.all([...document.images].filter(i => i.closest('.modal') === null).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))`);
  await ev(`document.fonts.ready.then(() => 1)`);
  await sleep(1500);
  // freeze time-based things
  await ev(`(() => { let id = setTimeout(() => {}, 0); while (id--) { clearTimeout(id); clearInterval(id); } const t = document.querySelector('.typer'); if (t) t.innerHTML = 'Familie'; const c = document.querySelector('.cursor'); if (c) c.style.opacity = '1'; const s = document.createElement('style'); s.textContent = ${JSON.stringify(TEST_CSS)}; document.head.appendChild(s); return 1; })()`);
  await sleep(300);
}
async function shot(name, full) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full });
  writeFileSync(join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
}

for (const [w, h, m] of [[1440, 900, false], [1024, 768, false], [768, 1024, true], [375, 812, true], [320, 568, true]]) {
  await load(w, h, m); await shot(`full-${w}`, true);
}
// scrolled header
await load(1440, 900, false);
await ev(`(() => { window.scrollTo(0, 1200); window.dispatchEvent(new Event('scroll')); return 1; })()`); await sleep(500);
await shot('state-scrolled-1440');
// hover on 2nd gallery tile
await load(1440, 900, false);
const rect = await ev(`(() => { const a = document.querySelectorAll('.gal-item a')[1]; a.scrollIntoView({block:'center'}); window.dispatchEvent(new Event('scroll')); const r = a.getBoundingClientRect(); return {x: r.x + r.width/2, y: r.y + r.height/2}; })()`);
await sleep(400);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y }); await sleep(400);
await shot('state-hover-1440');
// modals: first tile, cevapi (4th), garden2 (21st)
for (const [idx, nm] of [[0, 'first'], [3, 'cevapi'], [20, 'garden2']]) {
  await load(1440, 900, false);
  await ev(`(async () => { const a = document.querySelectorAll('.gal-item a[data-toggle="modal"]')[${idx}]; a.scrollIntoView({block:'center'}); a.click(); await new Promise(r => setTimeout(r, 300)); const img = document.querySelector('.modal.in img'); if (img && !img.complete) await new Promise(r => { img.onload = img.onerror = r; }); await new Promise(r => setTimeout(r, 300)); return 1; })()`);
  await shot(`state-modal-${nm}-1440`);
}
// mobile nav open
await load(375, 812, true);
await ev(`(async () => { document.querySelector('.navbar-toggle').click(); await new Promise(r => setTimeout(r, 800)); return 1; })()`);
await shot('state-mobilenav-375');

writeFileSync(join(OUT, 'log.txt'), [...new Set(log)].join('\n'));
console.log('LOG:\n' + [...new Set(log)].join('\n'));
ws.close(); chrome.kill(); await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
