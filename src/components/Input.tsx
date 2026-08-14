import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, leadingIcon, trailingAction, hint, id, className = "", ...props },
  ref,
) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label && <span className="field__label">{label}</span>}
      <span className="field__control">
        {leadingIcon && <span className="field__leading">{leadingIcon}</span>}
        <input ref={ref} id={inputId} {...props} />
        {trailingAction && <span className="field__trailing">{trailingAction}</span>}
      </span>
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
});
