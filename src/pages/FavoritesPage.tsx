import { PageHeader } from "../components/PageHeader";
import { CredentialList } from "../credentials/CredentialList";
import { useCredentials } from "../credentials/CredentialProvider";

export function FavoritesPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { credentials, loading, toggleFavorite } = useCredentials();
  const favorites = credentials.filter((credential) => credential.favorite);
  return <div className="page"><PageHeader eyebrow="Pinned" title="Favorites" description="Quick access to the credentials you use most." /><section className="content-card vault-list-shell"><div className="vault-list-heading"><span>Favorite items</span><span>{favorites.length} credentials</span></div>{loading ? <div className="credential-loading"><span className="auth-loading__spinner" /><p>Loading favorites…</p></div> : <CredentialList credentials={favorites} emptyTitle="No favorites yet" emptyDescription="Use the star beside a credential to keep it here." onOpen={onOpen} onToggleFavorite={(id) => void toggleFavorite(id)} />}</section></div>;
}
