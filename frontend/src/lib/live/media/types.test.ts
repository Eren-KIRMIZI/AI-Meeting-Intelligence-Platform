import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  avatarPalette,
  colorFor,
  initialsFor,
  newPeerId,
  selfParticipant,
} from './types';

const identity = {
  peerId: 'peer-1',
  userId: 'user-1',
  fullName: 'Ada Lovelace',
  initials: 'AL',
  avatarColor: '#5B8DEF',
};

describe('live media types', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('derives compact initials from names', () => {
    expect(initialsFor('   ')).toBe('NV');
    expect(initialsFor('ada')).toBe('AD');
    expect(initialsFor('  Ada   Byron Lovelace  ')).toBe('AL');
  });

  it('assigns a stable palette colour', () => {
    expect(colorFor('Ada Lovelace')).toBe(colorFor('Ada Lovelace'));
    expect(avatarPalette).toContain(colorFor('Ada Lovelace'));
  });

  it('uses the native UUID helper when present', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-123' });

    expect(newPeerId()).toBe('uuid-123');
  });

  it('falls back to a readable id without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {});
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(newPeerId()).toBe('peer-1000-0.5');
  });

  it('builds the local participant snapshot', () => {
    expect(
      selfParticipant(identity, { micOn: true, cameraOn: false, sharing: true }, 'now')
    ).toEqual({
      ...identity,
      isSelf: true,
      micOn: true,
      cameraOn: false,
      sharing: true,
      joinedAt: 'now',
      connection: 'connected',
    });
  });
});
