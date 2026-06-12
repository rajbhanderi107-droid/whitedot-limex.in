import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function PasswordInput({
  id,
  value,
  onChange,
  className = "adm-input",
  placeholder,
  autoComplete,
  required,
  minLength,
  autoFocus,
  disabled,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? undefined;

  return (
    <div className="adm-password-wrap">
      <input
        id={inputId}
        className={`${className} adm-password-input`}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        disabled={disabled}
      />
      <button
        type="button"
        className="adm-password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        disabled={disabled}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
