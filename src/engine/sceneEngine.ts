import {
  CharacterDefinition,
  CharacterId,
  LoadedScene,
  MAX_TONE,
  MIN_TONE,
  SceneDefinition,
  SceneEvent,
  SceneSnapshot,
  SimulationOptions,
  SimulationResult,
  ToneValue,
} from "../types/scene";
import { validateScene } from "./validateScene";

function clampTone(value: number): ToneValue {
  return Math.max(MIN_TONE, Math.min(MAX_TONE, value));
}

function sortEvents(events: SceneEvent[]): SceneEvent[] {
  return [...events].sort((left, right) => {
    if (left.time !== right.time) {
      return left.time - right.time;
    }

    return left.id.localeCompare(right.id);
  });
}

function createBaselineToneMap(
  characters: CharacterDefinition[],
): Record<CharacterId, ToneValue> {
  return characters.reduce<Record<CharacterId, ToneValue>>((accumulator, character) => {
    accumulator[character.id] = clampTone(character.baselineTone);
    return accumulator;
  }, {});
}

function applyDecayStep(
  currentTone: ToneValue,
  baselineTone: ToneValue,
  elapsedSeconds: number,
  decayRatePerSecond: number,
): ToneValue {
  if (elapsedSeconds <= 0 || decayRatePerSecond <= 0 || currentTone === baselineTone) {
    return currentTone;
  }

  const distanceToBaseline = baselineTone - currentTone;
  const maxDecayAmount = decayRatePerSecond * elapsedSeconds;

  if (Math.abs(distanceToBaseline) <= maxDecayAmount) {
    return baselineTone;
  }

  return clampTone(currentTone + Math.sign(distanceToBaseline) * maxDecayAmount);
}

function applyDecayAcrossCharacters(
  tones: Record<CharacterId, ToneValue>,
  baselines: Record<CharacterId, ToneValue>,
  elapsedSeconds: number,
  decayRatePerSecond: number,
): Record<CharacterId, ToneValue> {
  const nextTones: Record<CharacterId, ToneValue> = {};

  for (const characterId of Object.keys(tones)) {
    nextTones[characterId] = applyDecayStep(
      tones[characterId],
      baselines[characterId],
      elapsedSeconds,
      decayRatePerSecond,
    );
  }

  return nextTones;
}

function computeAggregateTone(tones: Record<CharacterId, ToneValue>): ToneValue {
  const characterIds = Object.keys(tones);

  if (characterIds.length === 0) {
    return 0;
  }

  const total = characterIds.reduce((sum, characterId) => sum + tones[characterId], 0);
  return clampTone(total / characterIds.length);
}

export function loadScene(scene: SceneDefinition): LoadedScene {
  const validation = validateScene(scene);

  if (!validation.valid) {
    throw new Error(`Invalid scene definition:\n${validation.errors.join("\n")}`);
  }

  return {
    scene,
    sortedEvents: sortEvents(scene.events),
  };
}

export function sampleSceneAtTime(
  loadedScene: LoadedScene,
  sampleTimeSeconds: number,
): SceneSnapshot {
  const sceneTime = Math.max(0, Math.min(sampleTimeSeconds, loadedScene.scene.duration));
  const baselines = createBaselineToneMap(loadedScene.scene.characters);
  let tones = { ...baselines };
  let previousTimeSeconds = 0;

  for (const event of loadedScene.sortedEvents) {
    if (event.time > sceneTime) {
      break;
    }

    if (loadedScene.scene.decay?.enabled) {
      tones = applyDecayAcrossCharacters(
        tones,
        baselines,
        event.time - previousTimeSeconds,
        loadedScene.scene.decay.decayRatePerSecond,
      );
    }

    tones[event.actor] = clampTone(tones[event.actor] + event.toneShift);
    previousTimeSeconds = event.time;
  }

  if (loadedScene.scene.decay?.enabled) {
    tones = applyDecayAcrossCharacters(
      tones,
      baselines,
      sceneTime - previousTimeSeconds,
      loadedScene.scene.decay.decayRatePerSecond,
    );
  }

  return {
    time: sceneTime,
    characterTones: tones,
    aggregateTone: computeAggregateTone(tones),
  };
}

export function simulateScene(
  loadedScene: LoadedScene,
  options: SimulationOptions,
): SimulationResult {
  if (options.sampleInterval <= 0) {
    throw new Error("Sample interval must be greater than 0 seconds.");
  }

  const snapshots: SceneSnapshot[] = [];
  let currentTimeSeconds = 0;

  while (currentTimeSeconds < loadedScene.scene.duration) {
    snapshots.push(sampleSceneAtTime(loadedScene, currentTimeSeconds));
    currentTimeSeconds += options.sampleInterval;
  }

  snapshots.push(sampleSceneAtTime(loadedScene, loadedScene.scene.duration));

  return { snapshots };
}

export function exportScene(scene: SceneDefinition): string {
  return JSON.stringify(scene, null, 2);
}
