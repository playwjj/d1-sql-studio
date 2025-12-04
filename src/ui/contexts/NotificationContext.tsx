import { createContext, ComponentChildren } from 'preact';
import { useState, useContext, useCallback } from 'preact/hooks';
import { Toast } from '../components/shared/Toast';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

interface ToastOptions {
  message: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  duration?: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface NotificationContextType {
  showToast: (options: ToastOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface ToastState {
  id: number;
  message: string;
  variant: 'success' | 'danger' | 'warning' | 'info';
  duration: number;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function NotificationProvider({ children }: { children: ComponentChildren }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const showToast = useCallback((options: ToastOptions) => {
    const id = toastIdCounter;
    setToastIdCounter(id + 1);

    setToasts((prev) => [
      ...prev,
      {
        id,
        message: options.message,
        variant: options.variant || 'info',
        duration: options.duration || 3000,
      },
    ]);
  }, [toastIdCounter]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({
        title: options.title || 'Confirm Action',
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'primary',
        onConfirm: () => {
          setConfirm(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirm(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              variant={toast.variant}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          variant={confirm.variant}
          onConfirm={confirm.onConfirm}
          onCancel={confirm.onCancel}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
