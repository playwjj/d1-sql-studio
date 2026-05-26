import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider';
import type { DialogApiInjection } from 'naive-ui/es/dialog/src/DialogProvider';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ConfirmOptions {
  title?: string;
  content: string;
  type?: 'warning' | 'error' | 'info';
  positiveText?: string;
  negativeText?: string;
}

export const useNotificationStore = defineStore('notification', () => {
  const _message = ref<MessageApiInjection | null>(null);
  const _dialog = ref<DialogApiInjection | null>(null);

  function init(message: MessageApiInjection, dialog: DialogApiInjection) {
    _message.value = message;
    _dialog.value = dialog;
  }

  function showToast({ message, type = 'info', duration = 3000 }: ToastOptions) {
    if (!_message.value) return;
    const opts = { duration };
    switch (type) {
      case 'success': _message.value.success(message, opts); break;
      case 'error':   _message.value.error(message, opts); break;
      case 'warning': _message.value.warning(message, opts); break;
      default:        _message.value.info(message, opts);
    }
  }

  function showConfirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (!_dialog.value) { resolve(false); return; }
      const method = options.type === 'error' ? 'error' : options.type === 'info' ? 'info' : 'warning';
      _dialog.value[method]({
        title: options.title ?? 'Confirm',
        content: options.content,
        positiveText: options.positiveText ?? 'Confirm',
        negativeText: options.negativeText ?? 'Cancel',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      });
    });
  }

  return { init, showToast, showConfirm };
});
