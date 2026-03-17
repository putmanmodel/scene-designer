import { useEffect, useState } from "react";
import { MAX_TONE, MIN_TONE, CharacterDefinition } from "../../types/scene";

interface CharacterSummaryProps {
  characters: CharacterDefinition[];
  onCommitCharacterId: (currentId: string, nextId: string) => string | null;
  onChangeBaselineTone: (characterId: string, nextBaselineTone: number) => void;
  onAddCharacter: () => void;
  onRemoveCharacter: (characterId: string) => void;
  canRemoveCharacter: (characterId: string) => boolean;
}

export function CharacterSummary({
  characters,
  onCommitCharacterId,
  onChangeBaselineTone,
  onAddCharacter,
  onRemoveCharacter,
  canRemoveCharacter,
}: CharacterSummaryProps) {
  const [draftIds, setDraftIds] = useState<Record<string, string>>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraftIds((currentDrafts) => {
      const nextDrafts: Record<string, string> = {};

      for (const character of characters) {
        nextDrafts[character.id] = currentDrafts[character.id] ?? character.id;
      }

      return nextDrafts;
    });
  }, [characters]);

  const updateDraftId = (characterId: string, nextId: string) => {
    setDraftIds((currentDrafts) => ({
      ...currentDrafts,
      [characterId]: nextId,
    }));
    setDraftErrors((currentErrors) => ({
      ...currentErrors,
      [characterId]: "",
    }));
  };

  const commitDraftId = (characterId: string) => {
    const nextId = draftIds[characterId] ?? characterId;
    const error = onCommitCharacterId(characterId, nextId);

    if (error) {
      setDraftErrors((currentErrors) => ({
        ...currentErrors,
        [characterId]: error,
      }));
      setDraftIds((currentDrafts) => ({
        ...currentDrafts,
        [characterId]: characterId,
      }));
      return;
    }

    setDraftErrors((currentErrors) => ({
      ...currentErrors,
      [characterId]: "",
    }));
  };

  return (
    <div className="character-list">
      <div className="section-row">
        <p className="section-copy">
          Characters define baseline tone targets used by the composition engine.
        </p>
        <button type="button" className="secondary-button" onClick={onAddCharacter}>
          Add Character
        </button>
      </div>
      {characters.map((character, index) => (
        <div className="character-card" key={`${index}-${character.id}`}>
          <label className="field">
            <span>Character id</span>
            <input
              type="text"
              value={draftIds[character.id] ?? character.id}
              onChange={(event) => updateDraftId(character.id, event.target.value)}
              onBlur={() => commitDraftId(character.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </label>
          {draftErrors[character.id] ? (
            <p className="error-text">{draftErrors[character.id]}</p>
          ) : null}
          <label className="field">
            <span>Baseline tone</span>
            <input
              type="number"
              min={MIN_TONE}
              max={MAX_TONE}
              step={0.01}
              value={character.baselineTone}
              onChange={(event) =>
                onChangeBaselineTone(character.id, Number(event.target.value))
              }
            />
          </label>
          <button
            type="button"
            className="ghost-button"
            onClick={() => onRemoveCharacter(character.id)}
            disabled={!canRemoveCharacter(character.id)}
            title={
              canRemoveCharacter(character.id)
                ? "Remove character"
                : "Reassign or remove related events before deleting this character."
            }
          >
            Remove
          </button>
          {!canRemoveCharacter(character.id) ? (
            <p className="field-help">
              Reassign or delete this character&apos;s events before removing it.
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
