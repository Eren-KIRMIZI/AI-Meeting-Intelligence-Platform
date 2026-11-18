const CHUNK_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'dynamically imported module',
];

/**
 * Route chunks are fetched on first visit, so a flaky network can reject the
 * dynamic import instead of throwing a normal render error. Those failures need
 * a reload rather than a React state reset.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}
