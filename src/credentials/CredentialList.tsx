import { EmptyState } from "../components/EmptyState";
import type { CredentialSummary } from "../types/credential";
import { CredentialItem } from "./CredentialItem";

interface CredentialListProps {
  credentials: CredentialSummary[];
  compact?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onOpen: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function CredentialList({ credentials, compact = false, emptyTitle, emptyDescription, onOpen, onToggleFavorite }: CredentialListProps) {
  if (credentials.length === 0) return <EmptyState compact={compact} title={emptyTitle} description={emptyDescription} />;
  return (
    <div className={`credential-list${compact ? " credential-list--compact" : ""}`}>
      {credentials.map((credential) => (
        <CredentialItem
          key={credential.id}
          credential={credential}
          compact={compact}
          onOpen={() => onOpen(credential.id)}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(credential.id) : undefined}
        />
      ))}
    </div>
  );
}

