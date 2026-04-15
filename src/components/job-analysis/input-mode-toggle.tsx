type InputMode = "paste" | "url";

interface InputModeToggleProps {
  value: InputMode;
  onChange: (mode: InputMode) => void;
}

export function InputModeToggle({ value, onChange }: InputModeToggleProps) {
  return (
    <div className="input-mode-toggle inline-flex rounded-lg bg-surface-raised p-0.5">
      <button
        type="button"
        onClick={() => onChange("paste")}
        className={`mode-toggle-segment rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          value === "paste"
            ? "mode-toggle-active bg-brand text-white"
            : "mode-toggle-inactive text-text-secondary"
        }`}
      >
        Paste JD
      </button>
      <button
        type="button"
        onClick={() => onChange("url")}
        className={`mode-toggle-segment rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          value === "url"
            ? "mode-toggle-active bg-brand text-white"
            : "mode-toggle-inactive text-text-secondary"
        }`}
      >
        Use URL
      </button>
    </div>
  );
}
