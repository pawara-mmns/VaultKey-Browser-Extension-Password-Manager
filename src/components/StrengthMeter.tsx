import type { GeneratedPasswordMetrics, PasswordStrengthLevel } from "../security/passwordGenerator";

interface StrengthMeterProps {
  metrics: GeneratedPasswordMetrics;
  compact?: boolean;
}

const strengthScores: Record<PasswordStrengthLevel, number> = {
  "Very Weak": 1,
  Weak: 2,
  Fair: 3,
  Strong: 4,
  "Very Strong": 5,
};

export function StrengthMeter({ metrics, compact = false }: StrengthMeterProps) {
  const score = strengthScores[metrics.strength];
  const className = metrics.strength.toLowerCase().replace(" ", "-");

  return (
    <div className={`generated-strength generated-strength--${className}${compact ? " generated-strength--compact" : ""}`}>
      <div className="generated-strength__heading">
        <span>Password strength</span>
        <strong>{metrics.strength}</strong>
      </div>
      <div className="generated-strength__track" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((segment) => <span key={segment} className={segment <= score ? "is-active" : ""} />)}
      </div>
      <p>Approx. entropy: {metrics.entropyBits} bits</p>
    </div>
  );
}
