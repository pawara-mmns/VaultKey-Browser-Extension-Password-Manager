interface LogoProps {
  compact?: boolean;
  size?: "small" | "medium";
}

export function Logo({ compact = false, size = "medium" }: LogoProps) {
  return (
    <div className={`logo logo--${size}`} aria-label="VaultKey Browser">
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 3.5 26 7.8v7.1c0 6.4-4 11.4-10 13.6-6-2.2-10-7.2-10-13.6V7.8L16 3.5Z" fill="currentColor" />
          <path d="M12.2 15.2a3.8 3.8 0 1 1 6.8 2.3l2.2 2.2-1.8 1.8-2.1-2.1a3.8 3.8 0 0 1-5.1-4.2Z" fill="white" fillOpacity=".94" />
        </svg>
      </span>
      {!compact && (
        <span className="logo__wordmark">
          Vault<span>Key</span>
        </span>
      )}
    </div>
  );
}
