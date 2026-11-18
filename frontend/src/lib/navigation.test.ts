import { describe, expect, it } from 'vitest';
import { resolveRouteMeta } from './navigation';

describe('resolveRouteMeta', () => {
  it('resolves workspace routes with their parent', () => {
    expect(resolveRouteMeta('/tasks')).toEqual({
      title: 'My Tasks',
      parent: 'Workspace',
    });
    expect(resolveRouteMeta('/intelligence')).toEqual({
      title: 'AI Intelligence',
      parent: 'Workspace',
    });
  });

  it('resolves detail routes to their owning module', () => {
    expect(resolveRouteMeta('/meetings/m-product-sync-past')).toEqual({
      title: 'Meeting detail',
      parent: 'Meetings',
    });
    expect(resolveRouteMeta('/projects/p-pulse')).toEqual({
      title: 'Project detail',
      parent: 'Projects',
    });
    expect(resolveRouteMeta('/live/room-123')).toEqual({
      title: 'Live room',
      parent: 'Nova Live',
    });
  });

  it('does not pretend an unknown route is the overview', () => {
    expect(resolveRouteMeta('/does-not-exist')).toEqual({
      title: 'Not found',
      parent: 'Workspace',
    });
  });
});
