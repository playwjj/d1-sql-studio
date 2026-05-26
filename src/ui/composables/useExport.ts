import { useNotificationStore } from '@/stores/notification';
import { exportToCSV, exportToJSON, copySQLInserts } from '@/lib/exportUtils';
import type { RowData } from '@/types';

export function useExport(options?: { tableName?: string }) {
  const notif = useNotificationStore();

  function handleExportCSV(data: RowData[], filename?: string) {
    exportToCSV(data, filename ?? `${options?.tableName ?? 'export'}.csv`);
    notif.showToast({ message: 'Exported as CSV', type: 'success' });
  }

  function handleExportJSON(data: RowData[], filename?: string) {
    exportToJSON(data, filename ?? `${options?.tableName ?? 'export'}.json`);
    notif.showToast({ message: 'Exported as JSON', type: 'success' });
  }

  async function handleCopySQLInserts(data: RowData[], tableName?: string) {
    try {
      await copySQLInserts(data, tableName ?? options?.tableName ?? 'table');
      notif.showToast({ message: 'SQL INSERT copied to clipboard', type: 'success' });
    } catch {
      notif.showToast({ message: 'Failed to copy', type: 'error' });
    }
  }

  return { handleExportCSV, handleExportJSON, handleCopySQLInserts };
}
