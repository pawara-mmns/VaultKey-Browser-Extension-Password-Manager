import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const options = [
  { label: "Uppercase", checked: true },
  { label: "Lowercase", checked: true },
  { label: "Numbers", checked: true },
  { label: "Symbols", checked: true },
];

export function GeneratorPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Tools"
        title="Password generator"
        description="A preview of the secure generator planned for Phase 03."
      />
      <section className="generator-card">
        <div className="generator-card__label">
          <span>Generated password</span>
          <span className="phase-pill">Preview only</span>
        </div>
        <div className="generated-password">
          <span aria-label="Hidden generator preview">••••••••••••••••••••</span>
          <button className="icon-button" type="button" aria-label="Copy unavailable until Phase 03" disabled>
            <Icon name="copy" size={19} />
          </button>
        </div>
        <div className="length-control">
          <div><label htmlFor="password-length">Password length</label><strong>20</strong></div>
          <input id="password-length" type="range" min="8" max="40" value="20" disabled readOnly />
          <div className="range-labels"><span>8</span><span>40</span></div>
        </div>
        <div className="option-grid">
          {options.map((option) => (
            <div className="option-row" key={option.label}>
              <span>{option.label}</span>
              <span className={`toggle${option.checked ? " toggle--on" : ""}`} aria-hidden="true"><span /></span>
            </div>
          ))}
        </div>
        <Button fullWidth size="large" leadingIcon={<Icon name="generate" size={18} />} disabled>
          Generate in Phase 03
        </Button>
      </section>
    </div>
  );
}
