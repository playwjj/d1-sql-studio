import { useEffect } from 'preact/hooks';

/**
 * Hook to detect clicks outside of a specified element
 * @param ref - Reference to the element
 * @param handler - Callback function to execute when clicking outside
 * @param enabled - Whether the hook is enabled (default: true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: { current: T | null },
  handler: (event: MouseEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, enabled]);
}
