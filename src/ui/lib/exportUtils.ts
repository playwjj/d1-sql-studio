/**
 * Export utilities for data export functionality
 */

/**
 * Convert data array to CSV format
 */
export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Escape CSV value (handle quotes and commas)
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const csvContent = [
    // Header row
    headers.map(escapeCSV).join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => escapeCSV(row[header])).join(',')
    )
  ].join('\n');

  // Create and trigger download
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data as JSON
 */
export function exportToJSON(data: any[], filename: string = 'export.json') {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}

/**
 * Generate SQL INSERT statements
 */
export function generateSQLInserts(data: any[], tableName: string): string {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);

  // Escape SQL value
  const escapeSQLValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    // Escape single quotes for strings
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  // Generate INSERT statements
  const sqlStatements = data.map(row => {
    const columns = headers.join(', ');
    const values = headers.map(header => escapeSQLValue(row[header])).join(', ');
    return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`;
  }).join('\n');

  return sqlStatements;
}

/**
 * Copy SQL INSERT statements to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (err) {
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Copy SQL INSERT statements to clipboard
 */
export async function copySQLInserts(data: any[], tableName: string): Promise<void> {
  const sqlStatements = generateSQLInserts(data, tableName);
  await copyToClipboard(sqlStatements);
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
