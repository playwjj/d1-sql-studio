/**
 * Security utilities for SQL injection prevention and input validation
 */

/**
 * Valid SQL identifier pattern: alphanumeric and underscores only
 * SQLite identifiers can start with letter or underscore, followed by letters, numbers, underscores
 */
const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * SQL keywords that are reserved
 * NOTE: We allow these as identifiers because we always use quoteIdentifier()
 * to wrap them in double quotes, which makes them safe in SQLite.
 * This list is kept for reference but not used in validation.
 */
const SQL_KEYWORDS_REFERENCE = new Set([
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
  'UNION', 'JOIN', 'WHERE', 'FROM', 'EXEC', 'EXECUTE', 'DECLARE', 'SCRIPT',
  'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
  'OR', 'AND', 'NOT', 'NULL', 'TRUE', 'FALSE', 'CASE', 'WHEN', 'THEN', 'ELSE',
  'BEGIN', 'END', 'TRANSACTION', 'COMMIT', 'ROLLBACK', 'GRANT', 'REVOKE'
]);

/**
 * Dangerous SQL patterns that indicate potential SQL injection
 */
const DANGEROUS_PATTERNS = [
  /--/,           // SQL comments
  /\/\*/,         // Block comments start
  /\*\//,         // Block comments end
  /;/,            // Statement separator
  /'/,            // String delimiter
  /"/,            // String delimiter
  /`/,            // Identifier delimiter
  /\\/,           // Escape character
  /\bor\b/i,      // OR keyword
  /\band\b/i,     // AND keyword
  /\bunion\b/i,   // UNION keyword
  /\bdrop\b/i,    // DROP keyword
  /\bexec\b/i,    // EXEC keyword
];

/**
 * Allowed SQL statement types for executeQuery
 * Allows read operations (SELECT, PRAGMA) and write operations (INSERT, UPDATE, DELETE)
 * Still blocks dangerous schema changes (DROP, CREATE, ALTER, TRUNCATE)
 */
const ALLOWED_SQL_STATEMENTS = ['SELECT', 'PRAGMA', 'INSERT', 'UPDATE', 'DELETE'];

/**
 * Validates a SQL identifier (table name, column name, etc.)
 * Prevents SQL injection by ensuring only safe characters
 *
 * NOTE: We allow SQL keywords (like 'update', 'delete', 'order', etc.) as identifiers
 * because we always wrap them in double quotes using quoteIdentifier().
 * SQLite supports quoted identifiers, making keywords safe to use as column/table names.
 *
 * @param identifier - The identifier to validate
 * @param type - Type of identifier for error messages
 * @throws Error if identifier is invalid
 */
export function validateIdentifier(identifier: string, type: string = 'identifier'): void {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error(`Invalid ${type}: must be a non-empty string`);
  }

  // Check length (SQLite max identifier length is 64KB, but we limit to reasonable size)
  if (identifier.length > 128) {
    throw new Error(`Invalid ${type}: exceeds maximum length of 128 characters`);
  }

  // Check pattern - only letters, numbers, and underscores
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Invalid ${type}: must contain only letters, numbers, and underscores, and start with a letter or underscore`);
  }

  // SQL keywords are now ALLOWED because we use quoteIdentifier() everywhere
  // This means 'update', 'delete', 'order', 'group', etc. are valid column names

  // Check for dangerous patterns (injection attempts)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(identifier)) {
      throw new Error(`Invalid ${type}: contains potentially dangerous characters`);
    }
  }
}

/**
 * Validates multiple identifiers (e.g., column names in INSERT/UPDATE)
 *
 * @param identifiers - Array of identifiers to validate
 * @param type - Type of identifiers for error messages
 * @throws Error if any identifier is invalid
 */
export function validateIdentifiers(identifiers: string[], type: string = 'identifier'): void {
  if (!Array.isArray(identifiers) || identifiers.length === 0) {
    throw new Error(`Invalid ${type}s: must be a non-empty array`);
  }

  for (const identifier of identifiers) {
    validateIdentifier(identifier, type);
  }
}

/**
 * Sanitizes a SQL identifier by wrapping it in double quotes
 * Should only be used AFTER validation
 *
 * @param identifier - The validated identifier
 * @returns Quoted identifier safe for SQL
 */
export function quoteIdentifier(identifier: string): string {
  // Even after validation, we double-quote to be extra safe
  // SQLite uses double quotes for identifiers
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Validates a SQL statement to ensure it's safe to execute
 * Allows: SELECT, PRAGMA, INSERT, UPDATE, DELETE
 * Blocks: DROP, CREATE, ALTER, TRUNCATE, and other DDL/admin commands
 *
 * @param sql - The SQL statement to validate
 * @throws Error if SQL is not allowed
 */
export function validateSQLStatement(sql: string): void {
  if (!sql || typeof sql !== 'string') {
    throw new Error('Invalid SQL: must be a non-empty string');
  }

  // Trim and get first word
  const trimmed = sql.trim();
  const firstWord = trimmed.split(/\s+/)[0].toUpperCase();

  // Check if it's an allowed statement type
  if (!ALLOWED_SQL_STATEMENTS.includes(firstWord)) {
    throw new Error(`SQL statement not allowed: only SELECT, PRAGMA, INSERT, UPDATE, DELETE queries are permitted. Received: ${firstWord}`);
  }

  // Check for dangerous schema modification keywords
  // These are still blocked even within allowed statements
  // Use word boundary regex to match whole words only, not substrings
  const dangerousKeywords = ['DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE', 'ATTACH', 'DETACH'];

  // Remove quoted identifiers and string literals to check for dangerous patterns
  // This allows keywords like "create", "update", "delete" when used as properly quoted column names
  let sqlWithoutQuotedContent = sql
    .replace(/"[^"]*"/g, '""')  // Remove double-quoted identifiers
    .replace(/'[^']*'/g, "''")  // Remove single-quoted string literals
    .replace(/`[^`]*`/g, '``')  // Remove backtick-quoted identifiers
    .toUpperCase();

  for (const keyword of dangerousKeywords) {
    // Use word boundary regex to match whole words only
    const keywordPattern = new RegExp(`\\b${keyword}\\b`);
    if (keywordPattern.test(sqlWithoutQuotedContent)) {
      throw new Error(`SQL statement not allowed: contains dangerous keyword '${keyword}'`);
    }
  }

  // Check for multiple statements (semicolon not at the end)
  const statements = sql.split(';').filter(s => s.trim());
  if (statements.length > 1) {
    throw new Error('SQL statement not allowed: multiple statements detected. Only single queries are permitted.');
  }

  // Check for SQL comments (can be used to hide malicious code)
  if (/--/.test(sql) || /\/\*/.test(sql) || /\*\//.test(sql)) {
    throw new Error('SQL statement not allowed: comments are not permitted');
  }
}

/**
 * Validates data for INSERT/UPDATE operations
 *
 * @param data - The data object to validate
 * @throws Error if data is invalid
 */
export function validateRowData(data: Record<string, any>): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid data: must be an object');
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new Error('Invalid data: must contain at least one field');
  }

  // Validate column names
  validateIdentifiers(keys, 'column name');

  // Validate that we don't have too many columns (prevent DoS)
  if (keys.length > 100) {
    throw new Error('Invalid data: too many columns (max 100)');
  }
}

/**
 * Validates pagination parameters
 *
 * @param page - Page number
 * @param limit - Items per page
 * @returns Validated and sanitized pagination params
 */
export function validatePagination(page: number, limit: number): { page: number; limit: number } {
  const validatedPage = Math.max(1, Math.floor(page || 1));
  const validatedLimit = Math.min(1000, Math.max(1, Math.floor(limit || 50)));

  return { page: validatedPage, limit: validatedLimit };
}
