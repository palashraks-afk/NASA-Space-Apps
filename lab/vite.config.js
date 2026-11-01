import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

// Development-only: lets the page POST a full-resolution frame to /__shot so it can be
// inspected on disk. Not part of the production build.
const shotPlugin = {
  name: "sol-shot",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/__shot", (req, res) => {
      const name = (new URL(req.url, "http://x").searchParams.get("name") || "shot").replace(/[^a-z0-9_-]/gi, "");
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const dir = path.resolve(".shots");
        fs.mkdirSync(dir, { recursive: true });
        const b64 = body.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(path.join(dir, `${name}.jpg`), Buffer.from(b64, "base64"));
        res.end("ok");
      });
    });
  },
};

export default defineConfig({
  plugins: [shotPlugin],
  worker: { format: "es" },
});
