export type ModuleName =
  | "noise"
  | "reaction_diffusion"
  | "cellular_automata"
  | "voronoi";

export type Settings = {
  seed: number;
  entropy: number; // 0..1
  module: ModuleName;

  // UI-only fields:
  _localPreviewBase64?: string;
  _lastResultBase64?: string;
};

export const defaultSettings: Settings = {
  seed: 1337,
  entropy: 0.25,
  module: "noise",
};
