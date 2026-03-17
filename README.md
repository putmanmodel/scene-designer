# Scene Designer v1

Scene Designer v1 is a small authoring tool for timed emotional compositions. A composition may represent a dramatic scene, an emotional score, or another structured sequence of timed tone events. The core model is deterministic and engine-agnostic, and the current app provides a minimal browser-based editor for authoring, previewing, importing, and exporting canonical JSON.

## Current Capabilities

- Edit a composition id, duration, and linear decay settings
- Define characters with baseline tones in the range `[-1, 1]`
- Place timed events on a composition timeline
- Add and delete timed events from the editor
- Drag events horizontally to change their time
- Edit event actor assignment and tone shifts
- Preview aggregate tone and per-character tone at a sampled time
- Import and export the canonical authored JSON format
- Validate duplicate ids, missing actors, invalid duration, and out-of-range event times

Try it in your browser: https://putmanmodel.github.io/scene-designer/
- No installation required for the live demo.

## Canonical Data Model

The authored data model is intentionally small:

- `SceneDefinition`
  - `id`
  - `duration`
  - `characters`
  - `events`
  - `decay`
- `CharacterDefinition`
  - `id`
  - `baselineTone`
- `SceneEvent`
  - `id`
  - `time`
  - `actor`
  - `toneShift`

All time values are in seconds. All tone values are clamped to `[-1, 1]`. Positive `toneShift` values increase activation or escalation, while negative values calm or de-escalate. Aggregate tone is the average of all current character tones after event application and linear decay toward baseline.

## Why "Scene" Also Applies to Score or Composition

The current schema uses scene-oriented type names because the project began as a scene authoring tool. In practice, the same structure also fits an emotional score or other timed composition:

- characters define baseline tone anchors
- timed events shift tone over the composition
- the engine samples aggregate tone at any point on the timeline

That means the tool can stay concrete and readable for scene work while still being useful for broader timed emotional authoring.

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run type checking:

```bash
npm run typecheck
```

Build the app:

```bash
npm run build
```

## Export and Import

The app exports the canonical authored `SceneDefinition` JSON exactly as edited. Import expects that same canonical shape and validates it before loading. Invalid JSON or invalid authored data is reported in the UI instead of being silently coerced.

## Current Limitations

- Tone is currently a single scalar axis, not a multi-dimensional emotion model
- The preview is intentionally simple and does not include advanced charting or playback
- The UI focuses on direct editing of the canonical authored data rather than workflow automation
- Export and import use the same authored JSON shape only; there is no separate runtime format in v1

## Future Expansion

This version is intentionally minimal. If it proves useful, it may later be expanded with richer tone dimensions, runtime integrations, or alternate packaging.

## License

This project is licensed under **CC-BY-NC-4.0 International**.

You may use, study, share, and adapt this work for non-commercial purposes with attribution. Commercial use requires separate permission.

## Feedback

Feedback is appreciated. This version is intentionally minimal, and thoughtful suggestions or practical observations may help improve later iterations.

## Contact

Stephen A. Putman  
GitHub: `putmanmodel`  
Email: `putmanmodel@pm.me`
