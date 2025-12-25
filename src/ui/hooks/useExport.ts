import { useCallback, useState } from 'preact/hooks';
import { exportToCSV, exportToJSON, copySQLInserts } from '../lib/exportUtils';
import { useNotification } from '../contexts/NotificationContext';
import { RowData } from '../types';

interface UseExportOptions {
  tableName?: string;
  onSuccess?: () => void;
}

/**
 * Hook to handle data export functionality
 * Provides handlers for CSV, JSON, and SQL INSERT exports
 */
export function useExport(options: UseExportOptions = {}) {
  const { tableName = 'table', onSuccess } = options;
  const { showToast } = useNotification();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = useCallback(
    (data: RowData[], filename?: string) => {
      try {
        if (!data || data.length === 0) {
          showToast({ message: 'No data to export', variant: 'warning' });
          return;
        }

        setIsExporting(true);
        exportToCSV(data, filename || `${tableName}_export.csv`);
        showToast({ message: 'Data exported to CSV successfully', variant: 'success' });
        onSuccess?.();
      } catch (err: any) {
        showToast({ message: err.message || 'Failed to export CSV', variant: 'danger' });
      } finally {
        setIsExporting(false);
      }
    },
    [tableName, showToast, onSuccess]
  );

  const handleExportJSON = useCallback(
    (data: RowData[], filename?: string) => {
      try {
        if (!data || data.length === 0) {
          showToast({ message: 'No data to export', variant: 'warning' });
          return;
        }

        setIsExporting(true);
        exportToJSON(data, filename || `${tableName}_export.json`);
        showToast({ message: 'Data exported to JSON successfully', variant: 'success' });
        onSuccess?.();
      } catch (err: any) {
        showToast({ message: err.message || 'Failed to export JSON', variant: 'danger' });
      } finally {
        setIsExporting(false);
      }
    },
    [tableName, showToast, onSuccess]
  );

  const handleCopySQLInserts = useCallback(
    async (data: RowData[], table?: string) => {
      try {
        if (!data || data.length === 0) {
          showToast({ message: 'No data to copy', variant: 'warning' });
          return;
        }

        setIsExporting(true);
        await copySQLInserts(data, table || tableName);
        showToast({ message: 'SQL INSERT statements copied to clipboard', variant: 'success' });
        onSuccess?.();
      } catch (err: any) {
        showToast({ message: err.message || 'Failed to copy SQL', variant: 'danger' });
      } finally {
        setIsExporting(false);
      }
    },
    [tableName, showToast, onSuccess]
  );

  return {
    handleExportCSV,
    handleExportJSON,
    handleCopySQLInserts,
    isExporting,
  };
}
