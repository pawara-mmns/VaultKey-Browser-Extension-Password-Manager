import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { VaultApp } from "./VaultApp";
import "../styles/tokens.css";
import "../styles/globals.css";
import "../styles/components.css";
import "./vault.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <VaultApp />
    </AppErrorBoundary>
  </StrictMode>,
);
