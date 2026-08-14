import { Logo } from "../components/Logo";

interface VaultLoadingViewProps {
  context: "popup" | "vault";
}

export function VaultLoadingView({ context }: VaultLoadingViewProps) {
  return (
    <main className={`unlock-panel unlock-panel--${context} auth-loading`} aria-live="polite">
      <Logo />
      <div className="auth-loading__spinner" aria-hidden="true" />
      <strong>Checking local vault...</strong>
      <span>Preparing your private workspace</span>
    </main>
  );
}
