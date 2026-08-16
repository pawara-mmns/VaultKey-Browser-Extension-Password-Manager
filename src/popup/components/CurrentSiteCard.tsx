import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import type { CredentialSiteMatch } from "../../services/siteMatchingService";
import type { CurrentSite } from "../../types/currentSite";
import { PopupCredentialList } from "./PopupCredentialList";

interface CurrentSiteCardProps {
  currentSite: CurrentSite | null;
  loading: boolean;
  matches: CredentialSiteMatch[];
  matchesLoading: boolean;
  onAddLogin: () => void;
  onOpen: (id: string) => void;
}

export function CurrentSiteCard({ currentSite, loading, matches, matchesLoading, onAddLogin, onOpen }: CurrentSiteCardProps) {
  return (
    <section className="current-site-section" aria-labelledby="current-site-heading">
      <div className="popup-section-heading"><h2 id="current-site-heading">Current website</h2><span>Active tab only</span></div>
      <div className={`current-site-card${currentSite?.supported ? "" : " current-site-card--unavailable"}`}>
        <div className="current-site-card__icon"><Icon name="globe" size={18} /></div>
        <div><strong>{loading ? "Detecting website…" : currentSite?.supported ? currentSite.displayHostname : "Current website unavailable"}</strong><span>{currentSite?.supported ? "Strict local hostname matching" : "This page cannot be matched safely."}</span></div>
      </div>

      {currentSite?.supported && (
        <div className="site-matches">
          <div className="popup-section-heading"><h2>Matching accounts</h2><span>{matches.length} {matches.length === 1 ? "account" : "accounts"}</span></div>
          {matchesLoading ? <div className="site-matches__loading">Checking encrypted vault…</div> : matches.length > 0 ? (
            <PopupCredentialList credentials={matches.map((match) => match.credential)} onOpen={onOpen} showUsernameCopy />
          ) : (
            <div className="site-no-match"><p>No saved login for this site.</p><Button variant="secondary" size="small" leadingIcon={<Icon name="add" size={15} />} onClick={onAddLogin}>Add login</Button></div>
          )}
        </div>
      )}
    </section>
  );
}
