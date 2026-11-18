import { describe, expect, it } from 'vitest';
import { isChunkLoadError } from './errors';

describe('isChunkLoadError', () => {
  it('recognises dynamic import failures from the major browsers', () => {
    expect(
      isChunkLoadError(
        new Error(
          'Failed to fetch dynamically imported module: https://nova.app/assets/TasksPage.js'
        )
      )
    ).toBe(true);
    expect(
      isChunkLoadError(
        new TypeError('Importing a module script failed.')
      )
    ).toBe(true);
  });

  it('leaves ordinary render errors alone', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of null'))).toBe(
      false
    );
    expect(isChunkLoadError('network down')).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});
