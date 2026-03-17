import { useState } from "react";
import { exampleScene, exportScene, loadScene, sampleSceneAtTime } from "../index";
import { validateScene } from "../engine/validateScene";
import {
  CharacterDefinition,
  MAX_TONE,
  MIN_TONE,
  SceneDefinition,
  SceneEvent,
  ToneValue,
} from "../types/scene";
import { CharacterSummary } from "./components/CharacterSummary";
import { CompositionEditor } from "./components/CompositionEditor";
import { EventInspector } from "./components/EventInspector";
import { ImportPanel } from "./components/ImportPanel";
import { TimelineEditor } from "./components/TimelineEditor";
import { TonePreview } from "./components/TonePreview";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function replaceEvent(
  scene: SceneDefinition,
  eventId: string,
  updater: (event: SceneEvent) => SceneEvent,
): SceneDefinition {
  return {
    ...scene,
    events: scene.events.map((event) => (event.id === eventId ? updater(event) : event)),
  };
}

function replaceCharacter(
  scene: SceneDefinition,
  characterId: string,
  updater: (character: CharacterDefinition) => CharacterDefinition,
): SceneDefinition {
  return {
    ...scene,
    characters: scene.characters.map((character) =>
      character.id === characterId ? updater(character) : character,
    ),
  };
}

function nextCharacterId(scene: SceneDefinition): string {
  let index = scene.characters.length + 1;
  let candidate = `character-${index}`;

  while (scene.characters.some((character) => character.id === candidate)) {
    index += 1;
    candidate = `character-${index}`;
  }

  return candidate;
}

function nextEventId(scene: SceneDefinition): string {
  let index = scene.events.length + 1;
  let candidate = `event-${index}`;

  while (scene.events.some((event) => event.id === candidate)) {
    index += 1;
    candidate = `event-${index}`;
  }

  return candidate;
}

function parseImportedScene(source: string): SceneDefinition {
  const normalizedSource = source
    .trim()
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'");

  try {
    const parsed = JSON.parse(normalizedSource) as unknown;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Imported JSON must be an object in the canonical composition format.");
    }

    return parsed as SceneDefinition;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Unable to parse imported text as canonical JSON. Check quotes, commas, and braces. ${error.message}`
        : "Unable to parse imported text as canonical JSON. Check quotes, commas, and braces.",
    );
  }
}

function downloadSceneJson(scene: SceneDefinition): void {
  const json = exportScene(scene);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${scene.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [scene, setScene] = useState<SceneDefinition>(exampleScene);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    exampleScene.events[0]?.id ?? null,
  );
  const [previewTime, setPreviewTime] = useState<number>(0);
  const [importText, setImportText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);

  const validation = validateScene(scene);
  const validationErrors = [...validation.errors];
  let loadedScene = null;

  if (validation.valid) {
    try {
      loadedScene = loadScene(scene);
    } catch (error) {
      validationErrors.push(
        error instanceof Error ? error.message : "Unable to load the current scene.",
      );
    }
  }

  const preview = loadedScene ? sampleSceneAtTime(loadedScene, previewTime) : null;
  const selectedEvent = scene.events.find((event) => event.id === selectedEventId) ?? null;
  const characterIds = scene.characters.map((character) => character.id);

  const updateEventTime = (eventId: string, nextTime: number) => {
    setScene((currentScene) =>
      replaceEvent(currentScene, eventId, (event) => ({
        ...event,
        time: clamp(nextTime, 0, currentScene.duration),
      })),
    );
  };

  const updateEventToneShift = (eventId: string, nextToneShift: ToneValue) => {
    setScene((currentScene) =>
      replaceEvent(currentScene, eventId, (event) => ({
        ...event,
        toneShift: clamp(nextToneShift, MIN_TONE, MAX_TONE),
      })),
    );
  };

  const updateEventActor = (eventId: string, nextActor: string) => {
    setScene((currentScene) =>
      replaceEvent(currentScene, eventId, (event) => ({
        ...event,
        actor: nextActor,
      })),
    );
  };

  const updateCompositionId = (nextId: string) => {
    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      id: nextId,
    }));
  };

  const updateDuration = (nextDuration: number) => {
    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      duration: Math.max(1, Math.floor(nextDuration || 1)),
    }));
    setPreviewTime((currentTime) => clamp(currentTime, 0, Math.max(1, Math.floor(nextDuration || 1))));
  };

  const updateDecayEnabled = (enabled: boolean) => {
    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      decay: {
        enabled,
        decayRatePerSecond: currentScene.decay?.decayRatePerSecond ?? 0,
      },
    }));
  };

  const updateDecayRate = (nextRate: number) => {
    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      decay: {
        enabled: currentScene.decay?.enabled ?? false,
        decayRatePerSecond: Math.max(0, nextRate || 0),
      },
    }));
  };

  const commitCharacterId = (currentId: string, nextId: string): string | null => {
    const trimmedId = nextId.trim();

    if (trimmedId.length === 0) {
      const message = "Character id cannot be empty.";
      setEditorMessage(message);
      return message;
    }

    if (
      scene.characters.some(
        (character) => character.id === trimmedId && character.id !== currentId,
      )
    ) {
      const message = `Character id "${trimmedId}" is already in use.`;
      setEditorMessage(message);
      return message;
    }

    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      characters: currentScene.characters.map((character) =>
        character.id === currentId ? { ...character, id: trimmedId } : character,
      ),
      events: currentScene.events.map((event) =>
        event.actor === currentId ? { ...event, actor: trimmedId } : event,
      ),
    }));
    return null;
  };

  const updateCharacterBaseline = (characterId: string, nextBaselineTone: number) => {
    setEditorMessage(null);
    setScene((currentScene) =>
      replaceCharacter(currentScene, characterId, (character) => ({
        ...character,
        baselineTone: clamp(nextBaselineTone, MIN_TONE, MAX_TONE),
      })),
    );
  };

  const addCharacter = () => {
    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      characters: [
        ...currentScene.characters,
        { id: nextCharacterId(currentScene), baselineTone: 0 },
      ],
    }));
  };

  const canRemoveCharacter = (characterId: string): boolean =>
    !scene.events.some((event) => event.actor === characterId);

  const removeCharacter = (characterId: string) => {
    if (!canRemoveCharacter(characterId)) {
      setEditorMessage(
        `Character "${characterId}" cannot be removed until its events are reassigned or deleted.`,
      );
      return;
    }

    setEditorMessage(null);
    setScene((currentScene) => ({
      ...currentScene,
      characters: currentScene.characters.filter((character) => character.id !== characterId),
    }));
  };

  const applyImportedScene = (nextScene: SceneDefinition) => {
    setScene(nextScene);
    setImportText(exportScene(nextScene));
    setImportError(null);
    setSelectedEventId(nextScene.events[0]?.id ?? null);
    setPreviewTime((currentTime) => clamp(currentTime, 0, nextScene.duration));
  };

  const importFromText = () => {
    try {
      const parsedScene = parseImportedScene(importText);
      const validationResult = validateScene(parsedScene);

      if (!validationResult.valid) {
        throw new Error(validationResult.errors.join(" "));
      }

      applyImportedScene(parsedScene);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unable to import the provided JSON.",
      );
    }
  };

  const importFromFile = async (file: File) => {
    try {
      const fileContents = await file.text();
      setImportText(fileContents);
      const parsedScene = parseImportedScene(fileContents);
      const validationResult = validateScene(parsedScene);

      if (!validationResult.valid) {
        throw new Error(validationResult.errors.join(" "));
      }

      applyImportedScene(parsedScene);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unable to import the selected JSON file.",
      );
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Scene Designer v1</h1>
          <p>Author timed emotional compositions for scenes, scores, and related runtime use.</p>
        </div>
        <div className="scene-meta">
          <span>Composition: {scene.id}</span>
          <span>Duration: {scene.duration}s</span>
        </div>
      </header>

      {validationErrors.length > 0 ? (
        <section className="validation-panel" aria-live="polite">
          <h2>Validation</h2>
          <ul>
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <main className="app-grid">
        <section className="panel">
          <h2>Composition</h2>
          <CompositionEditor
            composition={scene}
            onChangeId={updateCompositionId}
            onChangeDuration={updateDuration}
            onChangeDecayEnabled={updateDecayEnabled}
            onChangeDecayRate={updateDecayRate}
          />
          <h2>Characters</h2>
          <CharacterSummary
            characters={scene.characters}
            onCommitCharacterId={commitCharacterId}
            onChangeBaselineTone={updateCharacterBaseline}
            onAddCharacter={addCharacter}
            onRemoveCharacter={removeCharacter}
            canRemoveCharacter={canRemoveCharacter}
          />
        </section>

        <section className="panel panel-wide">
          <h2>Timeline Composition</h2>
          <TimelineEditor
            duration={scene.duration}
            events={scene.events}
            selectedEventId={selectedEventId}
            previewTime={previewTime}
            canAddEvent={scene.characters.length > 0}
            onAddEvent={() => {
              const nextActor =
                (selectedEvent && characterIds.includes(selectedEvent.actor)
                  ? selectedEvent.actor
                  : scene.characters[0]?.id) ?? null;

              if (!nextActor) {
                return;
              }

              const eventId = nextEventId(scene);
              const nextEvent: SceneEvent = {
                id: eventId,
                time: clamp(previewTime, 0, scene.duration),
                actor: nextActor,
                toneShift: 0,
              };

              setScene((currentScene) => ({
                ...currentScene,
                events: [...currentScene.events, nextEvent],
              }));
              setEditorMessage(null);
              setSelectedEventId(eventId);
            }}
            onSelectEvent={setSelectedEventId}
            onChangeEventTime={updateEventTime}
            onChangePreviewTime={(nextTime) =>
              setPreviewTime(clamp(nextTime, 0, scene.duration))
            }
          />
          <EventInspector
            event={selectedEvent}
            duration={scene.duration}
            characterIds={characterIds}
            onChangeTime={(nextTime) => {
              if (selectedEvent) {
                updateEventTime(selectedEvent.id, nextTime);
              }
            }}
            onChangeToneShift={(nextToneShift) => {
              if (selectedEvent) {
                updateEventToneShift(selectedEvent.id, nextToneShift);
              }
            }}
            onChangeActor={(nextActor) => {
              if (selectedEvent) {
                updateEventActor(selectedEvent.id, nextActor);
              }
            }}
            onDeleteEvent={() => {
              if (selectedEvent) {
                const remainingEvents = scene.events.filter(
                  (event) => event.id !== selectedEvent.id,
                );
                setScene((currentScene) => ({
                  ...currentScene,
                  events: currentScene.events.filter(
                    (event) => event.id !== selectedEvent.id,
                  ),
                }));
                setEditorMessage(null);
                setSelectedEventId(remainingEvents[0]?.id ?? null);
              }
            }}
          />
        </section>

        <section className="panel">
          <h2>Tone Preview</h2>
          <TonePreview
            previewTime={previewTime}
            snapshot={preview}
            scene={scene}
            disabled={!loadedScene}
            onExport={() => downloadSceneJson(scene)}
          />
          <h2>Import</h2>
          <ImportPanel
            importText={importText}
            importError={importError}
            onChangeImportText={(nextText) => {
              setImportText(nextText);
              setImportError(null);
            }}
            onImportText={importFromText}
            onImportFile={importFromFile}
          />
        </section>
      </main>
      {editorMessage ? (
        <section className="validation-panel validation-panel-inline" aria-live="polite">
          <h2>Editor Message</h2>
          <p>{editorMessage}</p>
        </section>
      ) : null}
    </div>
  );
}
