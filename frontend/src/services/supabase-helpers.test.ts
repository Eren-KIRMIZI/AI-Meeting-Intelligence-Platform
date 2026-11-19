import { describe, expect, it } from 'vitest';
import {
  assertOrg,
  getClient,
  mapProfile,
  placeholderProfile,
  profileFor,
} from './supabase-helpers';

describe('supabase helpers (demo mode)', () => {
  it('maps a profile row into a display profile', () => {
    const profile = mapProfile({
      id: 'user-1',
      full_name: '  Ada Lovelace  ',
      email: 'ada@example.com',
      avatar_url: null,
      job_title: 'PM',
    });

    expect(profile).toMatchObject({
      id: 'user-1',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      initials: 'AL',
      jobTitle: 'PM',
    });
  });

  it('falls back to the email local part when the name is blank', () => {
    expect(
      mapProfile({
        id: 'user-2',
        full_name: '   ',
        email: 'grace@example.com',
        avatar_url: null,
        job_title: null,
      }).fullName
    ).toBe('grace');
  });

  it('creates a placeholder only for a known id', () => {
    expect(placeholderProfile(null)).toBeNull();
    expect(placeholderProfile('user-9')).toMatchObject({
      id: 'user-9',
      initials: 'TM',
    });
  });

  it('resolves profiles from the map with a placeholder fallback', () => {
    const profiles = new Map([['user-1', mapProfile({
      id: 'user-1',
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
      avatar_url: null,
      job_title: null,
    })]]);

    expect(profileFor('user-1', profiles)?.fullName).toBe('Ada Lovelace');
    expect(profileFor('missing', profiles)?.initials).toBe('TM');
    expect(profileFor(null, profiles)).toBeNull();
  });

  it('requires an active organization for live queries', () => {
    expect(() => assertOrg(null)).toThrow(/active organization/i);
    expect(assertOrg('org-1')).toBe('org-1');
  });

  it('fails clearly when the live client is unavailable', () => {
    expect(() => getClient()).toThrow(/not configured/i);
  });
});
