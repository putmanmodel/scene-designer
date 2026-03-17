import {
  MAX_TONE,
  MIN_TONE,
  SceneDefinition,
} from "../types/scene";

export interface SceneValidationResult {
  valid: boolean;
  errors: string[];
}

function isToneInRange(value: number): boolean {
  return value >= MIN_TONE && value <= MAX_TONE;
}

export function validateScene(scene: SceneDefinition): SceneValidationResult {
  const errors: string[] = [];

  if (scene.duration <= 0) {
    errors.push("Scene duration must be greater than 0 seconds.");
  }

  const characterIds = new Set<string>();
  for (const character of scene.characters) {
    if (characterIds.has(character.id)) {
      errors.push(`Duplicate character id "${character.id}".`);
    } else {
      characterIds.add(character.id);
    }

    if (!isToneInRange(character.baselineTone)) {
      errors.push(
        `Character "${character.id}" baselineTone must be within [-1, 1].`,
      );
    }
  }

  const eventIds = new Set<string>();
  for (const event of scene.events) {
    if (eventIds.has(event.id)) {
      errors.push(`Duplicate event id "${event.id}".`);
    } else {
      eventIds.add(event.id);
    }

    if (!characterIds.has(event.actor)) {
      errors.push(
        `Event "${event.id}" references unknown actor "${event.actor}".`,
      );
    }

    if (event.time < 0 || event.time > scene.duration) {
      errors.push(
        `Event "${event.id}" time must be within [0, ${scene.duration}] seconds.`,
      );
    }

    if (!isToneInRange(event.toneShift)) {
      errors.push(`Event "${event.id}" toneShift must be within [-1, 1].`);
    }
  }

  if (scene.decay && scene.decay.decayRatePerSecond < 0) {
    errors.push("Decay rate must be greater than or equal to 0.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
