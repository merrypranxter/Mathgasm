import http from "node:http";
import { renderNanoBanana, RenderRequest } from "../providers/nano_banana";
import { compilePrompt } from "../core/prompt_compiler/compilePrompt";
import type { Settings } from "../core/types";

const PORT = 8787;

function send(res: http.ServerResponse, code: number, obj: any) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/render") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(raw || "{}") as { settings: Settings; prompt?: string };
        const prompt = payload.prompt || compilePrompt(payload.settings);
        const parsed = RenderRequest.parse({ prompt, seed: payload.settings.seed });

        const out = await renderNanoBanana(parsed);
        send(res, 200, out);
      } catch (e: any) {
        send(res, 400, { error: e?.message ?? String(e) });
      }
    });
    return;
  }

  send(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
