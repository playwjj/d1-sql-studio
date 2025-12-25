import { QUERY_HISTORY_STORAGE_KEY, MAX_QUERY_HISTORY_ITEMS } from '../config/constants';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  success: boolean;
  rowCount?: number;
  duration?: string;
  error?: string;
}

export class QueryHistoryManager {
  static saveQuery(
    query: string,
    success: boolean,
    rowCount?: number,
    duration?: string,
    error?: string
  ): void {
    const history = this.getHistory();

    const item: QueryHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query: query.trim(),
      timestamp: Date.now(),
      success,
      rowCount,
      duration,
      error
    };

    // Add to beginning of array
    history.unshift(item);

    // Keep only the last MAX_QUERY_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_QUERY_HISTORY_ITEMS);

    this.setHistory(trimmedHistory);
  }

  static getHistory(): QueryHistoryItem[] {
    try {
      const stored = localStorage.getItem(QUERY_HISTORY_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load query history:', error);
      return [];
    }
  }

  static clearHistory(): void {
    localStorage.removeItem(QUERY_HISTORY_STORAGE_KEY);
  }

  static deleteItem(id: string): void {
    const history = this.getHistory();
    const filtered = history.filter(item => item.id !== id);
    this.setHistory(filtered);
  }

  static searchHistory(searchTerm: string): QueryHistoryItem[] {
    const history = this.getHistory();
    if (!searchTerm.trim()) return history;

    const term = searchTerm.toLowerCase();
    return history.filter(item =>
      item.query.toLowerCase().includes(term)
    );
  }

  static getSuccessfulQueries(): QueryHistoryItem[] {
    return this.getHistory().filter(item => item.success);
  }

  static getFailedQueries(): QueryHistoryItem[] {
    return this.getHistory().filter(item => !item.success);
  }

  private static setHistory(history: QueryHistoryItem[]): void {
    try {
      localStorage.setItem(QUERY_HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save query history:', error);
    }
  }
}
