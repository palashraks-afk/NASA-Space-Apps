// Syntax-check every source and script file (catches broken edits before they are committed).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (/\.(m?js)$/.test(e.name)) files.push(p);
});
walk("src"); walk("scripts");
let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { bad++; console.error(`FAIL ${f}\n${e.stderr}`); }
}
console.log(`${files.length - bad}/${files.length} files parse`);
process.exit(bad ? 1 : 0);
