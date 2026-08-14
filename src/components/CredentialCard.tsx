import type { CredentialSummary } from "../types";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface CredentialCardProps {
  credential: CredentialSummary;
  compact?: boolean;
  onFill?: () => void;
}

export function CredentialCard({ credential, compact = false, onFill }: CredentialCardProps) {
  return (
    <article className={`credential-card${compact ? " credential-card--compact" : ""}`}>
      <div className="credential-card__avatar" style={{ "--avatar-accent": credential.accent } as React.CSSProperties}>
        {credential.serviceName.charAt(0)}
      </div>
      <div className="credential-card__body">
        <div className="credential-card__title-row">
          <h3>{credential.serviceName}</h3>
          {credential.favorite && <Icon name="star" size={14} className="credential-card__star" />}
        </div>
        <p>{credential.username}</p>
        {!compact && <span>{credential.website}</span>}
      </div>
      {compact ? (
        <Button variant="secondary" size="small" onClick={onFill}>Fill</Button>
      ) : (
        <button className="icon-button" type="button" aria-label={`Open ${credential.serviceName}`}>
          <Icon name="chevron" size={18} />
        </button>
      )}
    </article>
  );
}
