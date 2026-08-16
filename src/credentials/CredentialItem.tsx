import { Icon } from "../components/Icon";
import type { CredentialSummary } from "../types/credential";

interface CredentialItemProps {
  credential: CredentialSummary;
  compact?: boolean;
  onOpen: () => void;
  onToggleFavorite?: () => void;
  action?: React.ReactNode;
}

export function CredentialItem({ credential, compact = false, onOpen, onToggleFavorite, action }: CredentialItemProps) {
  return (
    <article className={`credential-row${compact ? " credential-row--compact" : ""}${credential.unreadable ? " credential-row--unreadable" : ""}`}>
      <button className="credential-row__main" type="button" onClick={onOpen}>
        <span className="credential-row__avatar">{credential.serviceName.trim().charAt(0).toUpperCase() || "?"}</span>
        <span className="credential-row__copy">
          <strong>{credential.serviceName}</strong>
          <span>{credential.username || "No username"}</span>
          {!compact && <small>{credential.hostname || credential.website || "No website"}</small>}
        </span>
      </button>
      {action}
      {onToggleFavorite && (
        <button
          className={`icon-button credential-row__favorite${credential.favorite ? " is-favorite" : ""}`}
          type="button"
          aria-label={`${credential.favorite ? "Remove" : "Add"} ${credential.serviceName} ${credential.favorite ? "from" : "to"} favorites`}
          onClick={onToggleFavorite}
        >
          <Icon name="star" size={18} />
        </button>
      )}
      {!compact && <button className="icon-button" type="button" aria-label={`Open ${credential.serviceName}`} onClick={onOpen}><Icon name="chevron" size={18} /></button>}
    </article>
  );
}

