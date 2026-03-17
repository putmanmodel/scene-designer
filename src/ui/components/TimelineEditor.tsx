import { PointerEvent, useEffect, useRef } from "react";
import { SceneEvent } from "../../types/scene";

interface TimelineEditorProps {
  duration: number;
  events: SceneEvent[];
  selectedEventId: string | null;
  previewTime: number;
  canAddEvent: boolean;
  onAddEvent: () => void;
  onSelectEvent: (eventId: string) => void;
  onChangeEventTime: (eventId: string, nextTime: number) => void;
  onChangePreviewTime: (nextTime: number) => void;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function sortEvents(events: SceneEvent[]): SceneEvent[] {
  return [...events].sort((left, right) => {
    if (left.time !== right.time) {
      return left.time - right.time;
    }

    return left.id.localeCompare(right.id);
  });
}

interface EventViewModel {
  event: SceneEvent;
  label: string;
  lane: number;
}

interface ActiveDragState {
  eventId: string;
  pointerId: number;
  startClientX: number;
  hasMoved: boolean;
}

function buildEventViewModels(events: SceneEvent[]): EventViewModel[] {
  const sortedEvents = sortEvents(events);
  const actorCounts = new Map<string, number>();
  const laneEndTimes: number[] = [];
  const minimumLaneSpacingSeconds = 4;

  return sortedEvents.map((event) => {
    const nextActorCount = (actorCounts.get(event.actor) ?? 0) + 1;
    actorCounts.set(event.actor, nextActorCount);

    let lane = 0;
    while (
      lane < laneEndTimes.length &&
      Math.abs(event.time - laneEndTimes[lane]) < minimumLaneSpacingSeconds
    ) {
      lane += 1;
    }

    laneEndTimes[lane] = event.time;

    return {
      event,
      label: `${event.actor} ${nextActorCount}`,
      lane,
    };
  });
}

export function TimelineEditor({
  duration,
  events,
  selectedEventId,
  previewTime,
  canAddEvent,
  onAddEvent,
  onSelectEvent,
  onChangeEventTime,
  onChangePreviewTime,
}: TimelineEditorProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const activeDragRef = useRef<ActiveDragState | null>(null);
  const suppressClickRef = useRef(false);
  const eventViewModels = buildEventViewModels(events);
  const laneCount = Math.max(...eventViewModels.map((item) => item.lane + 1), 1);

  const toPercent = (time: number): number => {
    if (duration <= 0) {
      return 0;
    }

    return (time / duration) * 100;
  };

  const readTimeFromPointer = (clientX: number): number => {
    const rect = timelineRef.current?.getBoundingClientRect();

    if (!rect || rect.width === 0) {
      return 0;
    }

    const relativeX = clamp(clientX - rect.left, 0, rect.width);
    return clamp((relativeX / rect.width) * duration, 0, duration);
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent | globalThis.PointerEvent) => {
      const activeDrag = activeDragRef.current;

      if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
        return;
      }

      if (Math.abs(event.clientX - activeDrag.startClientX) > 2) {
        activeDrag.hasMoved = true;
      }

      onChangeEventTime(activeDrag.eventId, readTimeFromPointer(event.clientX));
    };

    const handlePointerUp = (event: PointerEvent | globalThis.PointerEvent) => {
      const activeDrag = activeDragRef.current;

      if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
        return;
      }

      suppressClickRef.current = activeDrag.hasMoved;
      activeDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [duration, onChangeEventTime]);

  const beginEventDrag = (pointerEvent: PointerEvent<HTMLButtonElement>, eventId: string) => {
    pointerEvent.preventDefault();
    suppressClickRef.current = false;
    activeDragRef.current = {
      eventId,
      pointerId: pointerEvent.pointerId,
      startClientX: pointerEvent.clientX,
      hasMoved: false,
    };
    onSelectEvent(eventId);
    onChangeEventTime(eventId, readTimeFromPointer(pointerEvent.clientX));
  };

  return (
    <div className="timeline-editor">
      <div className="timeline-toolbar">
        <div className="timeline-header">
          <span>0s</span>
          <span>{duration}s</span>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onAddEvent}
          disabled={!canAddEvent}
          title={canAddEvent ? "Add a new event" : "Add a character before creating events."}
        >
          Add Event
        </button>
      </div>
      <div className="timeline-scrubber">
        <label htmlFor="preview-time">Preview sample time</label>
        <input
          id="preview-time"
          type="range"
          min={0}
          max={duration}
          step={1}
          value={previewTime}
          onChange={(event) => onChangePreviewTime(Number(event.target.value))}
        />
        <span>{previewTime.toFixed(0)}s</span>
      </div>
      <div className="timeline-surface" ref={timelineRef}>
        <div className="timeline-track" />
        <div
          className="timeline-preview-marker"
          style={{ left: `${toPercent(previewTime)}%` }}
          aria-hidden="true"
        />
        {eventViewModels.map(({ event, label, lane }) => (
          <button
            key={event.id}
            type="button"
            className={`event-marker ${
              selectedEventId === event.id ? "selected" : ""
            } ${activeDragRef.current?.eventId === event.id ? "dragging" : ""}`}
            style={{
              left: `${toPercent(event.time)}%`,
              top: `${24 + lane * 44}px`,
              zIndex: activeDragRef.current?.eventId === event.id ? 3 : selectedEventId === event.id ? 2 : 1,
            }}
            onClick={(eventClick) => {
              if (suppressClickRef.current) {
                eventClick.preventDefault();
                suppressClickRef.current = false;
                return;
              }

              onSelectEvent(event.id);
            }}
            onPointerDown={(pointerEvent) => beginEventDrag(pointerEvent, event.id)}
            title={`${label} • ${event.id} • ${event.time}s`}
          >
            <span>{label}</span>
          </button>
        ))}
        <div
          className="timeline-lane-spacer"
          style={{ height: `${laneCount * 44}px` }}
          aria-hidden="true"
        />
      </div>
      <div className="timeline-event-list">
        <div className="timeline-event-list-header">
          <span>Time</span>
          <span>Label</span>
          <span>Shift</span>
        </div>
        {eventViewModels.map(({ event, label }) => (
          <button
            key={event.id}
            type="button"
            className={`timeline-event-row ${selectedEventId === event.id ? "selected" : ""}`}
            onClick={() => onSelectEvent(event.id)}
          >
            <span>{event.time.toFixed(0)}s</span>
            <span>{label}</span>
            <span>{event.toneShift.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
