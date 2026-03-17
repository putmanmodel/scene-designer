import { SceneDefinition } from "../../types/scene";

interface CompositionEditorProps {
  composition: SceneDefinition;
  onChangeId: (nextId: string) => void;
  onChangeDuration: (nextDuration: number) => void;
  onChangeDecayEnabled: (enabled: boolean) => void;
  onChangeDecayRate: (nextRate: number) => void;
}

export function CompositionEditor({
  composition,
  onChangeId,
  onChangeDuration,
  onChangeDecayEnabled,
  onChangeDecayRate,
}: CompositionEditorProps) {
  const decayEnabled = composition.decay?.enabled ?? false;
  const decayRatePerSecond = composition.decay?.decayRatePerSecond ?? 0;

  return (
    <div className="editor-stack">
      <p className="section-copy">
        A composition can represent a scene, an emotional score, or another timed tone
        sequence.
      </p>
      <label className="field">
        <span>Composition id</span>
        <input
          type="text"
          value={composition.id}
          onChange={(event) => onChangeId(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Duration (seconds)</span>
        <input
          type="number"
          min={1}
          step={1}
          value={composition.duration}
          onChange={(event) => onChangeDuration(Number(event.target.value))}
        />
      </label>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={decayEnabled}
          onChange={(event) => onChangeDecayEnabled(event.target.checked)}
        />
        <span>Enable linear decay toward baseline</span>
      </label>
      <label className="field">
        <span>Decay rate per second</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={decayRatePerSecond}
          onChange={(event) => onChangeDecayRate(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
