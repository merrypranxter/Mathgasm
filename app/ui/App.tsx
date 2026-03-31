import React, { useMemo, useState } from "react";
import { compilePrompt } from "../../core/prompt_compiler/compilePrompt";
import { makeNoiseFieldPNG } from "../../core/math_modules/noiseField";
import { defaultSettings, Settings } from "../../core/types";

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [status, setStatus] = useState<string>("idle");
  const prompt = useMemo(() => compilePrompt(settings), [settings]);

  async function handlePreview() {
    setStatus("rendering local preview…");
    // Generates a local math field png (base64) as a sanity check
    const pngBase64 = await makeNoiseFieldPNG(settings);
    setSettings((s) => ({ ...s, _localPreviewBase64: pngBase64 }));
    setStatus("preview ready");
  }

  async function handleCommit() {
    setStatus("calling provider…");
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, prompt }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error: " + (data?.error ?? "unknown"));
      return;
    }
    setSettings((s) => ({ ...s, _lastResultBase64: data.imageBase64 }));
    setStatus("done");
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h1>MathGasm</h1>
      <p style={{ opacity: 0.75 }}>
        Local math → masks/fields → prompt → provider adapter. Preview doesn’t burn API credits.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
          <h2>Controls</h2>

          <label style={{ display: "block", marginBottom: 8 }}>
            Seed
            <input
              type="number"
              value={settings.seed}
              onChange={(e) => setSettings({ ...settings, seed: Number(e.target.value) })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            Entropy (clean → corrupted)
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.entropy}
              onChange={(e) => setSettings({ ...settings, entropy: Number(e.target.value) })}
              style={{ display: "block", width: "100%" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            Module
            <select
              value={settings.module}
              onChange={(e) => setSettings({ ...settings, module: e.target.value as any })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            >
              <option value="noise">Noise Field (starter)</option>
              <option value="reaction_diffusion" disabled>Reaction–Diffusion (coming)</option>
              <option value="cellular_automata" disabled>Cellular Automata (coming)</option>
              <option value="voronoi" disabled>Voronoi + Distance Field (coming)</option>
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePreview}>Local preview</button>
            <button onClick={handleCommit}>Commit render</button>
          </div>

          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>Status: {status}</p>
        </section>

        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
          <h2>Prompt</h2>
          <textarea readOnly value={prompt} style={{ width: "100%", height: 260, padding: 8 }} />
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
          <h2>Local preview (math field)</h2>
          {settings._localPreviewBase64 ? (
            <img src={settings._localPreviewBase64} style={{ width: "100%", borderRadius: 12 }} />
          ) : (
            <p style={{ opacity: 0.7 }}>Run “Local preview”.</p>
          )}
        </section>

        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
          <h2>Last provider result</h2>
          {settings._lastResultBase64 ? (
            <img src={settings._lastResultBase64} style={{ width: "100%", borderRadius: 12 }} />
          ) : (
            <p style={{ opacity: 0.7 }}>Run “Commit render”.</p>
          )}
        </section>
      </div>
    </div>
  );
}
