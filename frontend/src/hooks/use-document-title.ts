import { useEffect } from 'react';

const BASE_TITLE = 'Nova — Meeting Intelligence Workspace';

/**
 * Keeps the browser tab meaningful per route so history, bookmarks and screen
 * reader tab lists name the actual page. The previous title is restored on
 * unmount, which keeps nested boundaries from leaking a stale title.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — Nova` : BASE_TITLE;

    return () => {
      document.title = previous;
    };
  }, [title]);
}

export { BASE_TITLE };
