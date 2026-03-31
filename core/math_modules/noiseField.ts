import type { Settings } from "../types";

/**
 * Produces a small PNG data URL as a local preview.
 * For v1, we do a deterministic value-noise + fbm-ish layering.
 * Later: replace with reaction–diffusion, CA, etc.
 */
export async function makeNoiseFieldPNG(s: Settings, size = 512): Promise<string> {
  const seed = s.seed >>> 0;
  const w = size, h = size;
  const pixels = new Uint8Array(w * h * 4);

  // Simple LCG for determinism
  let state = seed || 1;
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);

  // 2D value noise via grid hashing
  const gridSize = 64;
  const grid = new Float32Array((gridSize + 1) * (gridSize + 1));
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  function valueNoise(x: number, y: number): number {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    const tx = smooth(x - gx);
    const ty = smooth(y - gy);

    const idx = (ix: number, iy: number) => grid[iy * (gridSize + 1) + ix];

    const v00 = idx(gx, gy);
    const v10 = idx(gx + 1, gy);
    const v01 = idx(gx, gy + 1);
    const v11 = idx(gx + 1, gy + 1);

    const a = lerp(v00, v10, tx);
    const b = lerp(v01, v11, tx);
    return lerp(a, b, ty);
  }

  // fBm-like layering
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x / w) * gridSize;
      const ny = (y / h) * gridSize;

      let amp = 1;
      let freq = 1;
      let sum = 0;
      let norm = 0;

      for (let o = 0; o < 5; o++) {
        const v = valueNoise(nx * freq, ny * freq);
        sum += v * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2;
      }

      let v = sum / norm; // 0..1
      // Entropy pushes contrast + speckle
      const e = s.entropy;
      v = Math.pow(v, 1 - 0.5 * e);
      const speckle = (rand() - 0.5) * e * 0.25;
      v = Math.min(1, Math.max(0, v + speckle));

      const i = (y * w + x) * 4;
      const c = Math.floor(v * 255);

      // Simple false-color
      pixels[i + 0] = c;
      pixels[i + 1] = Math.floor(lerp(c, 255 - c, 0.35));
      pixels[i + 2] = Math.floor(lerp(255 - c, c, 0.25));
      pixels[i + 3] = 255;
    }
  }

  const png = encodePNG(w, h, pixels);
  return "data:image/png;base64," + Buffer.from(png).toString("base64");
}

/**
 * Minimal PNG encoder (RGBA, no fancy filters).
 * Uses zlib from node via dynamic import.
 */
function encodePNG(w: number, h: number, rgba: Uint8Array): Uint8Array {
  const { deflateSync } = require("node:zlib");

  const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let k = 0; k < 8; k++) {
        const mask = -(crc & 1);
        crc = (crc >>> 1) ^ (0xedb88320 & mask);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = new TextEncoder().encode(type);
    const len = data.length;
    const out = new Uint8Array(8 + len + 4);
    const view = new DataView(out.buffer);

    view.setUint32(0, len);
    out.set(typeBytes, 4);
    out.set(data, 8);

    const crcBuf = new Uint8Array(typeBytes.length + data.length);
    crcBuf.set(typeBytes, 0);
    crcBuf.set(data, typeBytes.length);
    view.setUint32(8 + len, crc32(crcBuf));
    return out;
  }

  // IHDR
  const ihdr = new Uint8Array(13);
  const ih = new DataView(ihdr.buffer);
  ih.setUint32(0, w);
  ih.setUint32(4, h);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT: each row prefixed with filter=0
  const stride = w * 4;
  const raw = new Uint8Array((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const compressed = deflateSync(raw);

  const iend = new Uint8Array(0);

  // Assemble
  const parts = [
    pngSignature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", iend),
  ];

  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
