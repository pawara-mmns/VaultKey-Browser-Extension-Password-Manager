import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Logo } from "../../components/Logo";
import { PasswordDisplay } from "../../components/PasswordDisplay";
import { StrengthMeter } from "../../components/StrengthMeter";
import { usePasswordGenerator } from "../../generator/usePasswordGenerator";
import {
  MAX_GENERATED_PASSWORD_LENGTH,
  MIN_GENERATED_PASSWORD_LENGTH,
  type PasswordGeneratorOptions,
} from "../../security/passwordGenerator";

type CharacterSetOption = "uppercase" | "lowercase" | "numbers" | "symbols";

const compactOptions: Array<{ id: CharacterSetOption; label: string }> = [
  { id: "uppercase", label: "A–Z" },
  { id: "lowercase", label: "a–z" },
  { id: "numbers", label: "0–9" },
  { id: "symbols", label: "Symbols" },
];

interface QuickGeneratorProps {
  onBack: () => void;
  onLock: () => Promise<void>;
  onOpenFullGenerator: () => void;
}

export function QuickGenerator({ onBack, onLock, onOpenFullGenerator }: QuickGeneratorProps) {
  const { settings, password, metrics, updateSettings, regenerate } = usePasswordGenerator();
  const [draftLength, setDraftLength] = useState(settings.length);
  const enabledSetCount = compactOptions.filter(({ id }) => settings[id]).length;
  const rangeProgress = ((draftLength - MIN_GENERATED_PASSWORD_LENGTH) /
    (MAX_GENERATED_PASSWORD_LENGTH - MIN_GENERATED_PASSWORD_LENGTH)) * 100;

  useEffect(() => setDraftLength(settings.length), [settings.length]);

  const commitLength = () => {
    if (draftLength !== settings.length) updateSettings({ ...settings, length: draftLength });
  };

  const updateOption = <Key extends keyof PasswordGeneratorOptions>(
    key: Key,
    value: PasswordGeneratorOptions[Key],
  ) => updateSettings({ ...settings, [key]: value });

  return (
    <main className="popup-shell quick-generator">
      <header className="popup-header">
        <div className="quick-generator__brand">
          <button className="icon-button quick-generator__back" type="button" aria-label="Back to vault" onClick={onBack}>
            <Icon name="arrow" size={17} />
          </button>
          <Logo size="small" />
        </div>
        <button className="lock-button" type="button" onClick={() => void onLock()}>
          <Icon name="lock" size={16} /><span>Lock</span>
        </button>
      </header>

      <div className="popup-content quick-generator__content">
        <div className="quick-generator__heading">
          <span className="eyebrow">Secure tool</span>
          <h1>Password generator</h1>
          <p>Generated locally with Web Crypto.</p>
        </div>

        <PasswordDisplay password={password} compact />
        <StrengthMeter metrics={metrics} compact />

        <div className="quick-generator__length">
          <div><label htmlFor="popup-password-length">Length</label><strong>{draftLength}</strong></div>
          <input
            id="popup-password-length"
            aria-label="Password length"
            type="range"
            min={MIN_GENERATED_PASSWORD_LENGTH}
            max={MAX_GENERATED_PASSWORD_LENGTH}
            value={draftLength}
            style={{ "--range-progress": `${rangeProgress}%` } as React.CSSProperties}
            onChange={(event) => setDraftLength(Number(event.target.value))}
            onPointerUp={commitLength}
            onKeyUp={commitLength}
            onBlur={commitLength}
          />
          <div className="range-labels"><span>8</span><span>64</span></div>
        </div>

        <fieldset className="quick-generator__options">
          <legend>Character types</legend>
          <div>
            {compactOptions.map(({ id, label }) => {
              const isLastEnabled = settings[id] && enabledSetCount === 1;
              return (
                <label className="quick-option" key={id}>
                  <input
                    type="checkbox"
                    checked={settings[id]}
                    disabled={isLastEnabled}
                    onChange={(event) => updateOption(id, event.target.checked)}
                  />
                  <span><Icon name="check" size={12} />{label}</span>
                </label>
              );
            })}
          </div>
          <label className="quick-option quick-option--wide">
            <input
              type="checkbox"
              checked={settings.excludeAmbiguous}
              onChange={(event) => updateOption("excludeAmbiguous", event.target.checked)}
            />
            <span><Icon name="check" size={12} />Exclude ambiguous</span>
          </label>
        </fieldset>

        <Button fullWidth leadingIcon={<Icon name="generate" size={17} />} onClick={regenerate}>
          Generate new
        </Button>
      </div>

      <footer className="popup-footer">
        <Button fullWidth variant="secondary" onClick={onOpenFullGenerator} trailingIcon={<Icon name="arrow" size={17} />}>
          Open full generator
        </Button>
      </footer>
    </main>
  );
}
