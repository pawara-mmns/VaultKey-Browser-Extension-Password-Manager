import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "medium",
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} button--${size}${fullWidth ? " button--full" : ""} ${className}`.trim()}
      {...props}
    >
      {leadingIcon && <span className="button__icon">{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span className="button__icon">{trailingIcon}</span>}
    </button>
  );
}
