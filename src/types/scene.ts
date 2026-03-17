export const MIN_TONE = -1;
export const MAX_TONE = 1;

export type ToneValue = number;
export type SceneId = string;
export type CharacterId = string;
export type EventId = string;

export interface CharacterDefinition {
  id: CharacterId;
  baselineTone: ToneValue;
}

export interface SceneEvent {
  id: EventId;
  // Seconds from scene start.
  time: number;
  actor: CharacterId;
  // Positive values escalate, negative values calm. Clamped to [-1, 1].
  toneShift: ToneValue;
}

export interface ToneDecaySettings {
  enabled: boolean;
  // Linear decay amount applied per second toward baseline.
  decayRatePerSecond: number;
}

export interface SceneDefinition {
  id: SceneId;
  // Total scene duration in seconds.
  duration: number;
  characters: CharacterDefinition[];
  events: SceneEvent[];
  decay?: ToneDecaySettings;
}

export interface CharacterToneState {
  characterId: CharacterId;
  baselineTone: ToneValue;
  currentTone: ToneValue;
}

export interface SceneSnapshot {
  // Sample time in seconds from scene start.
  time: number;
  characterTones: Record<CharacterId, ToneValue>;
  // Average of all current character tones at this sample time.
  aggregateTone: ToneValue;
}

export interface LoadedScene {
  scene: SceneDefinition;
  sortedEvents: SceneEvent[];
}

export interface SimulationOptions {
  // Sampling interval in seconds.
  sampleInterval: number;
}

export interface SimulationResult {
  snapshots: SceneSnapshot[];
}
