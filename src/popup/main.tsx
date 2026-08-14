import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "./PopupApp";
import "../styles/tokens.css";
import "../styles/globals.css";
import "../styles/components.css";
import "./popup.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
