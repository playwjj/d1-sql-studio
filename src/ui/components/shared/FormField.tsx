import { ComponentChildren } from 'preact';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: ComponentChildren;
  hint?: string;
}

export function FormField({
  label,
  name,
  error,
  touched,
  required,
  children,
  hint
}: FormFieldProps) {
  const showError = touched && error;

  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label}
        {required && <span style="color: var(--danger); margin-left: 4px;">*</span>}
      </label>
      {children}
      {showError && (
        <div className="form-error">
          <span className="form-error-icon">⚠</span>
          <span className="form-error-message">{error}</span>
        </div>
      )}
      {hint && !showError && (
        <div className="form-hint">{hint}</div>
      )}
    </div>
  );
}
