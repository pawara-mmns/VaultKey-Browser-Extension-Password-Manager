import { Component, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="unlock-panel auth-loading auth-error" role="alert">
        <Logo />
        <div className="unlock-panel__emblem auth-error__emblem"><Icon name="shield" size={24} /></div>
        <strong>VaultKey encountered an unexpected error.</strong>
        <span>Close and reopen the extension. Your stored vault was not changed.</span>
        <Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
      </main>
    );
  }
}
