import { exportScene } from "../../engine/sceneEngine";
import { SceneDefinition, SceneSnapshot } from "../../types/scene";

interface TonePreviewProps {
  previewTime: number;
  snapshot: SceneSnapshot | null;
  scene: SceneDefinition;
  disabled: boolean;
  onExport: () => void;
}

function toneBarWidth(value: number): number {
  return ((value + 1) / 2) * 100;
}

function interpretTone(value: number): string {
  if (value <= -0.2) {
    return "Calming / de-escalating";
  }

  if (value >= 0.2) {
    return "Activating / escalating";
  }

  return "Neutral / near baseline";
}

export function TonePreview({
  previewTime,
  snapshot,
  scene,
  disabled,
  onExport,
}: TonePreviewProps) {
  const exportPreview = exportScene(scene);

  return (
    <div className="preview-panel">
      <div className="preview-block">
        <span className="preview-label">Preview time</span>
        <strong>{previewTime.toFixed(0)}s</strong>
        <p className="preview-note">
          This preview is a single engine sample at the selected time after event application
          and linear decay toward baseline.
        </p>
      </div>
      <div className="preview-block">
        <span className="preview-label">Aggregate tone</span>
        <strong>{snapshot ? snapshot.aggregateTone.toFixed(2) : "--"}</strong>
        <span className="tone-interpretation">
          {snapshot ? interpretTone(snapshot.aggregateTone) : "Preview unavailable"}
        </span>
        <div className="tone-bar" aria-hidden="true">
          <div
            className="tone-bar-fill"
            style={{ width: `${snapshot ? toneBarWidth(snapshot.aggregateTone) : 50}%` }}
          />
        </div>
        <div className="tone-legend">
          <span>Negative: calming / de-escalating</span>
          <span>Near zero: neutral / baseline</span>
          <span>Positive: activating / escalating</span>
        </div>
      </div>
      <div className="preview-block">
        <span className="preview-label">Character tones in the same engine sample</span>
        {snapshot ? (
          <div className="tone-list">
            {scene.characters.map((character) => (
              <div className="tone-list-row" key={character.id}>
                <span>{character.id}</span>
                <strong>{snapshot.characterTones[character.id]?.toFixed(2) ?? "--"}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="preview-muted">Fix validation errors to preview tone.</p>
        )}
      </div>
      <button type="button" className="export-button" onClick={onExport} disabled={disabled}>
        Export Canonical JSON
      </button>
      <div className="preview-block">
        <span className="preview-label">Export preview</span>
        <pre className="json-preview">{exportPreview}</pre>
      </div>
    </div>
  );
}
