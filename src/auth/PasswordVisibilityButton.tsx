import { Icon } from "../components/Icon";

interface PasswordVisibilityButtonProps {
  visible: boolean;
  onToggle: () => void;
}

export function PasswordVisibilityButton({ visible, onToggle }: PasswordVisibilityButtonProps) {
  return (
    <button
      className="field__action"
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      onClick={onToggle}
    >
      <Icon name={visible ? "eyeOff" : "eye"} size={19} />
    </button>
  );
}
