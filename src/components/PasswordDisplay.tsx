import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { writePasswordToClipboard } from "../services/clipboardService";

interface PasswordDisplayProps {
  password: string;
  compact?: boolean;
}

type CopyStatus = "idle" | "copied" | "error";

export function PasswordDisplay({ password, compact = false }: PasswordDisplayProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    setCopyStatus("idle");
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, [password]);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const handleCopy = async () => {
    try {
      await writePasswordToClipboard(password);
      setCopyStatus("copied");
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className={`password-display${compact ? " password-display--compact" : ""}`}>
      <div className="password-display__control">
        <input
          aria-label="Generated password"
          className="password-display__input"
          type="text"
          value={password}
          readOnly
          spellCheck={false}
        />
        <button className="password-display__copy" type="button" aria-label="Copy generated password" onClick={() => void handleCopy()}>
          <Icon name={copyStatus === "copied" ? "check" : "copy"} size={compact ? 16 : 18} />
          <span>{copyStatus === "copied" ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className={`password-display__feedback password-display__feedback--${copyStatus}`} role="status" aria-live="polite">
        {copyStatus === "error" ? "Could not copy password." : copyStatus === "copied" ? "Password copied to clipboard." : "Generated locally and never stored."}
      </div>
    </div>
  );
}
