// Judge's-eye walk: a brand-new browser profile opens the app with no URL parameters at a
// common laptop size, as a judge would. Records load time, frame rate, page errors and a
// screenshot of every guided-tour step into .shots/judge/.
// Usage: node scripts/judge_walk.mjs [width] [height] [url]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [W = 1366, H = 768] = process.argv.slice(2, 4).map(Number);
const URL0 = process.argv[4] || "http://localhost:5199/";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9334;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sol-edge-judge-"));
const outDir = path.resolve(".shots/judge");
fs.mkdirSync(outDir, { recursive: true });
const browser = spawn(EDGE, ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(p) { for (let i = 0; i < 60; i++) { try { return await (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); } catch { await sleep(250); } } throw new Error("no devtools"); }
const pages = (await json("/json/list")).filter((t) => t.type === "page");
const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
});
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) errors.push("eval: " + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
  return r.result?.result?.value;
};
const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(s.result.data, "base64")); };
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.enable"); await send("Runtime.enable");
const t0 = Date.now();
await send("Page.navigate", { url: URL0 });
let ready = 0;
for (let i = 0; i < 120; i++) { if (await evaluate("document.querySelector('#loading')?.classList.contains('gone')")) { ready = Date.now() - t0; break; } await sleep(250); }
await sleep(2500);
await shot("00_first_screen");
const report = { size: `${W}x${H}`, readyMs: ready, steps: [] };
for (let k = 0; k < 12; k++) {
  const st = await evaluate(`(() => { const t = document.querySelector('.tour'); if (!t || t.hidden) return null; return { step: t.querySelector('.tour-step')?.textContent, title: t.querySelector('h3')?.textContent, words: t.querySelector('p')?.textContent.split(/\s+/).length, inspectorWords: document.querySelector('#inspector').innerText.split(/\s+/).length, tab: window.__sol?.S.tab }; })()`);
  if (!st) break;
  await sleep(2400);
  await shot(`${String(k + 1).padStart(2, "0")}_${st.tab}`);
  report.steps.push(st);
  await evaluate(`document.querySelector('.tour [data-t="next"]')?.click()`);
  await sleep(300);
}
report.fps = await evaluate("window.__solFps || null");
report.tabsOverflow = await evaluate("(() => { const t = document.querySelector('#tabs'); return t.scrollWidth > t.clientWidth + 2; })()");
report.minFontPx = await evaluate("(() => { let m = 99; for (const el of document.querySelectorAll('#inspector *')) { if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; const r = el.getBoundingClientRect(); if (!r.width) continue; m = Math.min(m, parseFloat(getComputedStyle(el).fontSize)); } return m; })()");
report.errors = errors;
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await send("Browser.close").catch(() => {});
browser.kill();
