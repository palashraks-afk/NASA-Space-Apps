// Full-resolution screenshots of the running dev server, driven over the DevTools protocol in
// real time with headless Edge and a throwaway profile (no personal browser data touched).
// Usage: node scripts/cdp_shot.mjs <scenario> [<scenario> ...]
// Each scenario loads /?auto=<scenario>, waits, optionally runs extra steps, then captures.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9333;
const profile = path.join(os.tmpdir(), "sol-edge-cdp-profile");
const outDir = path.resolve(".shots");
fs.mkdirSync(outDir, { recursive: true });

const browser = spawn(EDGE, [
  "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(p) {
  for (let i = 0; i < 60; i++) {
    try { return await (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); } catch { await sleep(250); }
  }
  throw new Error("DevTools endpoint did not come up");
}

const pages = (await json("/json/list")).filter((t) => t.type === "page");
const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Runtime.enable");

// Extra steps after the ?auto= driver has run, for states that need real-time animation.
const after = {
  rand: 0, step2: 4000, numbers2: 5000, overview: 0, locked: 0, run: 0, result: 0, resultnum: 1500, mars: 2500, clock: 3000,
};

for (const sc of process.argv.slice(2)) {
  await send("Page.navigate", { url: `http://localhost:5199/?auto=${sc}` });
  // wait for boot (the app exposes __sol when ready) and for the scripted steps to run
  for (let i = 0; i < 120; i++) { if (await evaluate("!!window.__sol")) break; await sleep(500); }
  await sleep(2500 + (after[sc] ?? 0));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, `C_${sc}.png`), Buffer.from(shot.result.data, "base64"));
  const fps = await evaluate("window.__solFps");
  console.log(`${sc}: saved, fps ${fps ? fps.toFixed(1) : "n/a"}`);
}
await send("Browser.close").catch(() => {});
setTimeout(() => { try { browser.kill(); } catch {} process.exit(0); }, 500);
