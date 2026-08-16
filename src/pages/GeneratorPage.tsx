import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { PasswordDisplay } from "../components/PasswordDisplay";
import { StrengthMeter } from "../components/StrengthMeter";
import { usePasswordGenerator } from "../generator/usePasswordGenerator";
import {
  MAX_GENERATED_PASSWORD_LENGTH,
  MIN_GENERATED_PASSWORD_LENGTH,
  type PasswordGeneratorOptions,
} from "../security/passwordGenerator";

type CharacterSetOption = "uppercase" | "lowercase" | "numbers" | "symbols";

const characterSetOptions: Array<{ id: CharacterSetOption; label: string; example: string }> = [
  { id: "uppercase", label: "Uppercase", example: "A–Z" },
  { id: "lowercase", label: "Lowercase", example: "a–z" },
  { id: "numbers", label: "Numbers", example: "0–9" },
  { id: "symbols", label: "Symbols", example: "!@#$" },
];

export function GeneratorPage({ onSaveToVault }: { onSaveToVault: (password: string) => void }) {
  const { settings, password, metrics, updateSettings, regenerate } = usePasswordGenerator();
  const [draftLength, setDraftLength] = useState(settings.length);
  const enabledSetCount = characterSetOptions.filter(({ id }) => settings[id]).length;
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
    <div className="page">
      <PageHeader
        eyebrow="Tools"
        title="Password generator"
        description="Create strong, unique passwords locally with cryptographically secure browser randomness."
      />
      <section className="generator-card" aria-labelledby="generated-password-label">
        <div className="generator-card__label">
          <span id="generated-password-label">Generated password</span>
          <span className="phase-pill">Web Crypto</span>
        </div>

        <PasswordDisplay password={password} />
        <StrengthMeter metrics={metrics} />

        <div className="length-control">
          <div><label htmlFor="password-length">Password length</label><strong>{draftLength}</strong></div>
          <input
            id="password-length"
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
          <div className="range-labels"><span>{MIN_GENERATED_PASSWORD_LENGTH}</span><span>{MAX_GENERATED_PASSWORD_LENGTH}</span></div>
        </div>

        <fieldset className="generator-options">
          <legend>Character types</legend>
          <div className="option-grid">
            {characterSetOptions.map(({ id, label, example }) => {
              const isLastEnabled = settings[id] && enabledSetCount === 1;
              return (
                <label className={`option-row${isLastEnabled ? " option-row--required" : ""}`} key={id}>
                  <span><strong>{label}</strong><small>{example}</small></span>
                  <input
                    className="toggle-input"
                    type="checkbox"
                    checked={settings[id]}
                    disabled={isLastEnabled}
                    onChange={(event) => updateOption(id, event.target.checked)}
                  />
                  <span className={`toggle${settings[id] ? " toggle--on" : ""}`} aria-hidden="true"><span /></span>
                </label>
              );
            })}
          </div>
          <label className="option-row option-row--wide">
            <span><strong>Exclude ambiguous characters</strong><small>Skip 0, O, o, 1, l and I</small></span>
            <input
              className="toggle-input"
              type="checkbox"
              checked={settings.excludeAmbiguous}
              onChange={(event) => updateOption("excludeAmbiguous", event.target.checked)}
            />
            <span className={`toggle${settings.excludeAmbiguous ? " toggle--on" : ""}`} aria-hidden="true"><span /></span>
          </label>
        </fieldset>

        <div className="generator-actions">
          <Button fullWidth size="large" variant="secondary" leadingIcon={<Icon name="generate" size={18} />} onClick={regenerate}>Generate new password</Button>
          <Button fullWidth size="large" leadingIcon={<Icon name="vault" size={18} />} onClick={() => onSaveToVault(password)}>Save to vault</Button>
        </div>
      </section>
    </div>
  );
}
