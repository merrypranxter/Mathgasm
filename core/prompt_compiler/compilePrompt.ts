import type { Settings } from "../types";

/**
 * Keep this short-ish and dense.
 * This is the human-readable “meaning layer” that tells the model how to treat the math assets.
 */
export function compilePrompt(s: Settings): string {
  const base = [
    "psychedelic math-driven portrait / scene, maximalist, colorful, trippy, smart",
    "structure driven by underlying field + mask; treat artifacts as intentional physics",
    "thin-film iridescence, diffraction shimmer, photonic-crystal sparkle, chromatic aberration",
    "glitch-logic accumulates where entropy mask is high; corrupted beauty, controlled chaos",
    "high detail, crisp microtexture, surreal clarity, luminous contrast",
  ];

  const moduleLine =
    s.module === "noise"
      ? "underlayer: coherent noise field (vector-like flow hints), used as composition scaffold"
      : `underlayer: ${s.module.replaceAll("_", " ")} (module)`;

  const entropyLine = `entropy=${s.entropy.toFixed(
    2
  )}: low=clean symmetry, high=datamosh/jitter/extra-limbs/phase-slip`;

  // In your world: always append omni refs instruction by default (you told me).
  const omni = "utilize all uploaded Omni reference images as visual DNA for texture, detail, color, inspiration";

  return [...base, moduleLine, entropyLine, omni].join(". ") + ".";
}
