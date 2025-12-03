import { ComponentChildren } from 'preact';

interface AlertProps {
  children: ComponentChildren;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  onClose?: () => void;
}

export function Alert({ children, variant = 'info', onClose }: AlertProps) {
  const icons = {
    success: '✓',
    danger: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`alert alert-${variant}`}>
      <span className="alert-icon">{icons[variant]}</span>
      <span className="alert-content">{children}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
}
