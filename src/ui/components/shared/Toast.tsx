import { h } from 'preact';
import { useEffect } from 'preact/hooks';

interface ToastProps {
  message: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, variant = 'info', duration = 3000, onClose }: ToastProps) {
  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${variant}`}>
      <span className="toast-icon">{icons[variant]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
