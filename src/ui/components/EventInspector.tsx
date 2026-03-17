import { ChangeEvent } from "react";
import { MAX_TONE, MIN_TONE, SceneEvent } from "../../types/scene";

interface EventInspectorProps {
  event: SceneEvent | null;
  duration: number;
  characterIds: string[];
  onChangeTime: (nextTime: number) => void;
  onChangeToneShift: (nextToneShift: number) => void;
  onChangeActor: (nextActor: string) => void;
  onDeleteEvent: () => void;
}

function readNumericValue(event: ChangeEvent<HTMLInputElement>): number {
  return Number(event.target.value);
}

export function EventInspector({
  event,
  duration,
  characterIds,
  onChangeTime,
  onChangeToneShift,
  onChangeActor,
  onDeleteEvent,
}: EventInspectorProps) {
  if (!event) {
    return <div className="inspector-empty">Select a timed event to edit its values.</div>;
  }

  return (
    <div className="inspector">
      <h3>Selected Event</h3>
      <div className="inspector-row">
        <span>ID</span>
        <strong>{event.id}</strong>
      </div>
      <label className="field">
        <span>Actor</span>
        <select value={event.actor} onChange={(inputEvent) => onChangeActor(inputEvent.target.value)}>
          {characterIds.map((characterId) => (
            <option key={characterId} value={characterId}>
              {characterId}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Time (seconds)</span>
        <input
          type="number"
          min={0}
          max={duration}
          step={1}
          value={event.time}
          onChange={(inputEvent) => onChangeTime(readNumericValue(inputEvent))}
        />
      </label>
      <label className="field">
        <span>Tone shift</span>
        <input
          type="range"
          min={MIN_TONE}
          max={MAX_TONE}
          step={0.01}
          value={event.toneShift}
          onChange={(inputEvent) => onChangeToneShift(readNumericValue(inputEvent))}
        />
      </label>
      <label className="field">
        <span>Tone shift value</span>
        <input
          type="number"
          min={MIN_TONE}
          max={MAX_TONE}
          step={0.01}
          value={event.toneShift}
          onChange={(inputEvent) => onChangeToneShift(readNumericValue(inputEvent))}
        />
      </label>
      <p className="field-help">
        Negative values calm or de-escalate. Positive values activate or escalate.
      </p>
      <button type="button" className="ghost-button" onClick={onDeleteEvent}>
        Delete Event
      </button>
    </div>
  );
}
