interface ImportPanelProps {
  importText: string;
  importError: string | null;
  onChangeImportText: (nextText: string) => void;
  onImportText: () => void;
  onImportFile: (file: File) => void;
}

export function ImportPanel({
  importText,
  importError,
  onChangeImportText,
  onImportText,
  onImportFile,
}: ImportPanelProps) {
  return (
    <div className="editor-stack">
      <p className="section-copy">
        Import canonical JSON to continue editing the same authored composition format.
      </p>
      <label className="field">
        <span>Paste JSON</span>
        <textarea
          className="text-area"
          value={importText}
          onChange={(event) => onChangeImportText(event.target.value)}
          placeholder='{"id":"composition-id","duration":90,"characters":[],"events":[]}'
        />
      </label>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onImportText}>
          Import From Text
        </button>
        <label className="secondary-button file-button">
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImportFile(file);
                event.target.value = "";
              }
            }}
          />
          Import File
        </label>
      </div>
      {importError ? <p className="error-text">{importError}</p> : null}
    </div>
  );
}
