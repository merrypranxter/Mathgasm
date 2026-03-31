# MathGasm

**Tagline:** *Entropy with intention.*

This repo contains a provider-agnostic AI art pipeline:
- local **math texture synth** (fields, masks, control images)
- **prompt compiler** (turn settings into dense, reusable prompts)
- **provider adapters** (Nano Banana now; Flux / SeedDream later)

> Note: **GHOSTMATH** is the creator/collective name. **MathGasm** is the app.

## Quick start (Node 18+)

```bash
npm install
npm run dev
```

## What’s inside

- `app/` — minimal web UI (Vite + React + TS)
- `core/` — math modules + prompt compiler
- `providers/` — API adapters (Nano Banana starter)
- `cache/` — deterministic cache (seed + settings)
- `presets/` — saved “entities”

## Environment

Copy `.env.example` to `.env` and set:

- `NANO_BANANA_API_KEY=...`

## Roadmap

- [ ] Reaction–Diffusion module (Turing patterns)
- [ ] Entropy mask + glitch accumulation
- [ ] Init-image / img2img pipeline
- [ ] Preset manager + export/share
- [ ] Provider swap: Flux / SeedDream
