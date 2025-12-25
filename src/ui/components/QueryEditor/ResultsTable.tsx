import { useState, useMemo } from 'preact/hooks';
import { Button } from '../shared';
import { RowData } from '../../types';

interface ResultsTableProps {
  results: RowData[];
  pageSize?: number;
}

export function ResultsTable({ results, pageSize = 50 }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get columns from first result
  const columns = useMemo(() => {
    if (results.length === 0) return [];
    return Object.keys(results[0]);
  }, [results]);

  // Sort results
  const sortedResults = useMemo(() => {
    if (!sortColumn) return results;

    return [...results].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedResults.slice(start, end);
  }, [sortedResults, currentPage, itemsPerPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (e: Event) => {
    const value = parseInt((e.target as HTMLSelectElement).value);
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div>
      <div style="overflow-x: auto;">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style="cursor: pointer; user-select: none;"
                  title="Click to sort"
                >
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>{col}</span>
                    {sortColumn === col && (
                      <span style="font-size: 10px;">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedResults.map((row, idx: number) => (
              <tr key={idx}>
                {columns.map((col, i: number) => (
                  <td key={i}>
                    {row[col] === null || row[col] === undefined ? (
                      <span style="color: var(--text-light); font-style: italic;">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span className="pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedResults.length)} of{' '}
              {sortedResults.length} rows
            </span>

            <select
              className="form-control"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style="width: auto; padding: 6px 10px; font-size: 13px;"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="500">500 per page</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px;">
            <Button
              variant="secondary"
              className="btn-sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              ««
            </Button>
            <Button
              variant="secondary"
              className="btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </Button>

            <div style="display: flex; gap: 4px; align-items: center;">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'secondary'}
                    className="btn-sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              className="btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </Button>
            <Button
              variant="secondary"
              className="btn-sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              »»
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
