import { useEffect } from 'react';
import { useI18n } from '@/i18n';

const BASE_TITLE = 'Nova — Meeting Intelligence Workspace';

/**
 * Keeps the browser tab meaningful per route so history, bookmarks and screen
 * reader tab lists name the actual page. The previous title is restored on
 * unmount, which keeps nested boundaries from leaking a stale title.
 */
export function useDocumentTitle(title?: string) {
  const { t, locale } = useI18n();

  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${t(title)} — Nova` : t(BASE_TITLE);

    return () => {
      document.title = previous;
    };
  }, [title, t, locale]);

  return null;
}

export { BASE_TITLE };
