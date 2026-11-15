// Renders docs/demo/deck.html (7 slides, 1280x720) to docs/demo/Sol-Lab-demo.pdf with headless Edge.
// Team name and members come from docs/demo/team.json. Run from lab/: node scripts/build_deck.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../docs/demo");
const team = JSON.parse(fs.readFileSync(path.join(dir, "team.json"), "utf8"));
let html = fs.readFileSync(path.join(dir, "deck.html"), "utf8");
for (const [k, v] of Object.entries(team)) html = html.replaceAll(`{{${k}}}`, v.replace(/[<>&]/g, ""));
const tmp = path.join(dir, "_render.html");
fs.writeFileSync(tmp, html);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sol-edge-deck-"));
const out = path.join(dir, "Sol-Lab-demo.pdf");
try {
  execFileSync("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", [
    "--headless=new", "--disable-gpu", `--user-data-dir=${profile}`, "--no-pdf-header-footer", "--print-to-pdf-no-header",
    `--print-to-pdf=${out}`, pathToFileURL(tmp).href,
  ], { stdio: "ignore", timeout: 120000 });
} finally {
  fs.rmSync(tmp, { force: true });
  setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 1500);
}
console.log("wrote", out, fs.statSync(out).size, "bytes");
