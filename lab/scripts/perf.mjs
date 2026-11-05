// Performance probe: loads a scenario in headless Edge on the real GPU and reports frame
// times, the app's own CPU cost per frame (update vs render), draw calls, triangles, the
// heaviest meshes, main-thread time split and the slowest JavaScript functions.
// The throwaway browser profile is deleted afterwards (they are hundreds of MB each).
// Usage: node scripts/perf.mjs [scenario] [width] [height]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sc = process.argv[2] || "overview";
const [W = 1366, H = 768] = process.argv.slice(3, 5).map(Number);
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9335;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sol-edge-perf-"));
const browser = spawn(EDGE, ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
  "--disk-cache-size=1", "--disable-gpu-shader-disk-cache",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const keepAlive = setInterval(() => {}, 1000);
const cleanup = () => { try { browser.kill(); } catch {} setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} clearInterval(keepAlive); }, 1500); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(p) {
  for (let i = 0; i < 80; i++) { try { return await (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); } catch { await sleep(250); } }
  throw new Error("DevTools endpoint did not come up");
}
try {
  let pages = [];
  for (let i = 0; i < 40 && !pages.length; i++) { pages = (await json("/json/list")).filter((t) => t.type === "page"); if (!pages.length) await sleep(250); }
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map(), errors = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) errors.push("eval: " + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result?.result?.value;
  };
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable");
  await send("Page.bringToFront");
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Runtime.enable");
  await send("Performance.enable");
  await send("Profiler.enable");
  await send("Page.navigate", { url: `http://localhost:5199/?auto=${sc}` });
  for (let i = 0; i < 160; i++) { if (await evaluate("!!window.__sol")) break; await sleep(250); }
  await sleep(5000);

  const gpu = await evaluate("(() => { const gl = document.querySelector('#stage canvas').getContext('webgl2'); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()");
  const draw = await evaluate(`new Promise((res) => {
    const r = window.__sol.R.renderer;
    requestAnimationFrame(() => { r.info.autoReset = false; r.info.reset();
      requestAnimationFrame(() => { const out = { calls: r.info.render.calls, triangles: r.info.render.triangles }; r.info.autoReset = true; res(out); }); });
  })`);
  const heavy = await evaluate(`(() => {
    const out = [];
    window.__sol.scene.traverse((o) => {
      if (!o.isMesh && !o.isPoints) return;
      const g = o.geometry, n = o.isInstancedMesh ? o.count : 1;
      const tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
      const names = []; for (let p = o; p && names.length < 2; p = p.parent) if (p.name) names.push(p.name);
      out.push(Math.round(tris * n) + " tris, x" + n + ", " + g.type + ", " + (names.join("<") || "module"));
    });
    return out.sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 12);
  })()`);
  const scene = await evaluate(`(() => {
    let meshes = 0, transparent = 0, casters = 0;
    window.__sol.scene.traverse((o) => { if (o.isMesh) { meshes++; if (o.castShadow) casters++; if ([].concat(o.material).some((m) => m.transparent)) transparent++; } });
    return { meshes, transparent, casters, passes: window.__sol.R.composer.passes.map((p) => p.constructor.name), dpr: window.__sol.R.renderer.getPixelRatio() };
  })()`);

  await evaluate("window.__solCpu = null");
  const m0 = Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map((x) => [x.name, x.value]));
  await send("Profiler.setSamplingInterval", { interval: 200 });
  await send("Profiler.start");
  await evaluate("window.__ft = []; (function f(t) { if (window.__lt) window.__ft.push(t - window.__lt); window.__lt = t; if (window.__ft.length < 100000) requestAnimationFrame(f); })(performance.now())");
  const SEC = 8;
  await sleep(SEC * 1000);
  const prof = (await send("Profiler.stop")).result.profile;
  const m1 = Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map((x) => [x.name, x.value]));
  const cpu = await evaluate("(() => { const c = window.__solCpu; return c ? 'update ' + (c.update / c.n).toFixed(1) + ' ms, render ' + (c.render / c.n).toFixed(1) + ' ms, worst ' + c.max.toFixed(0) + ' ms, ' + c.n + ' frames' : null; })()");
  const ft = ((await evaluate("window.__ft")) || []).slice(2).sort((a, b) => a - b);
  const pct = (p) => ft[Math.floor(ft.length * p)]?.toFixed(1);
  const self = new Map(), byId = new Map(prof.nodes.map((n) => [n.id, n]));
  prof.samples.forEach((sid, k) => {
    const n = byId.get(sid);
    const key = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").pop().split("?")[0]}:${n.callFrame.lineNumber + 1}`;
    self.set(key, (self.get(key) || 0) + (prof.timeDeltas[k] || 0) / 1000);
  });
  const top = [...self].filter(([k]) => !/^\((idle|program)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const per = (k) => (((m1[k] - m0[k]) * 1000) / SEC).toFixed(0);
  console.log(JSON.stringify({
    scenario: sc, gpu, fps: (ft.length / SEC).toFixed(1), frameMs: { p50: pct(0.5), p90: pct(0.9), p99: pct(0.99) }, cpu,
    draw, scene, heavy,
    mainThreadMsPerSec: { script: per("ScriptDuration"), layout: per("LayoutDuration"), style: per("RecalcStyleDuration"), task: per("TaskDuration") },
    topSelfMsOver8s: top.map(([k, v]) => `${v.toFixed(0)}  ${k}`), errors,
  }, null, 2));
  await send("Browser.close").catch(() => {});
} finally {
  cleanup();
}
