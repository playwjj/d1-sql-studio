/**
 * Safely stringify JSON data, handling special types like BigInt
 * @param data - The data to stringify
 * @param space - Optional spacing for formatting
 * @returns JSON string
 */
export function safeJsonStringify(data: any, space?: number): string {
  return JSON.stringify(data, (key, value) => {
    // Convert BigInt to string to avoid serialization errors
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, space);
}
