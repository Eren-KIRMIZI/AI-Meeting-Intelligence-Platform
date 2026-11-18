import { describe, expect, it } from 'vitest';
import type { AuditEvent, ComplianceControl, UserProfile } from '@/types';
import {
  auditEventsToCsv,
  auditSummary,
  complianceScore,
  emptyAuditFilters,
  filterAuditEvents,
  groupControlsByFramework,
} from './audit';

const ayse: UserProfile = {
  id: 'u-ayse',
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@novalabs.io',
  initials: 'AY',
  avatarColor: '#5B8DEF',
};

const emre: UserProfile = {
  id: 'u-emre',
  fullName: 'Emre Demir',
  email: 'emre@novalabs.io',
  initials: 'ED',
  avatarColor: '#34D399',
};

const now = new Date('2026-03-10T12:00:00.000Z');

function event(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: 'a-1',
    category: 'access',
    severity: 'info',
    action: 'Signed in',
    actor: ayse,
    target: 'Workspace',
    occurredAt: '2026-03-10T09:00:00.000Z',
    ipAddress: '10.0.0.1',
    ...overrides,
  };
}

function control(overrides: Partial<ComplianceControl> = {}): ComplianceControl {
  return {
    id: 'c-1',
    framework: 'gdpr',
    code: 'GDPR-1',
    title: 'Data processing agreement',
    description: 'Signed DPAs for every processor.',
    status: 'passing',
    owner: ayse,
    lastCheckedAt: '2026-03-01T10:00:00.000Z',
    evidenceCount: 3,
    ...overrides,
  };
}

describe('audit log helpers', () => {
  it('filters by category, severity and recency', () => {
    const list = [
      event({ id: 'a-1' }),
      event({
        id: 'a-2',
        category: 'security',
        severity: 'critical',
        action: 'Blocked sign-in',
        actor: emre,
        occurredAt: '2026-03-10T11:00:00.000Z',
      }),
      event({
        id: 'a-3',
        category: 'data',
        severity: 'warning',
        action: 'Exported transcript',
        occurredAt: '2026-02-01T11:00:00.000Z',
      }),
    ];

    expect(
      filterAuditEvents(
        list,
        { ...emptyAuditFilters(), category: 'security' },
        now
      ).map((item) => item.id)
    ).toEqual(['a-2']);

    expect(
      filterAuditEvents(
        list,
        { ...emptyAuditFilters(), severity: 'warning' },
        now
      ).map((item) => item.id)
    ).toEqual(['a-3']);

    expect(
      filterAuditEvents(list, { ...emptyAuditFilters(), days: 7 }, now).map(
        (item) => item.id
      )
    ).toEqual(['a-2', 'a-1']);
  });

  it('searches actors and actions with normalised Turkish text', () => {
    expect(
      filterAuditEvents(
        [event(), event({ id: 'a-2', actor: emre, action: 'Changed role' })],
        { ...emptyAuditFilters(), query: 'ayse' },
        now
      ).map((item) => item.id)
    ).toEqual(['a-1']);

    expect(
      filterAuditEvents(
        [event(), event({ id: 'a-2', actor: emre, action: 'Changed role' })],
        { ...emptyAuditFilters(), query: 'role emre' },
        now
      ).map((item) => item.id)
    ).toEqual(['a-2']);
  });

  it('summarises severity counts and the last day', () => {
    const list = [
      event(),
      event({
        id: 'a-2',
        severity: 'critical',
        occurredAt: '2026-03-10T11:30:00.000Z',
      }),
      event({
        id: 'a-3',
        severity: 'warning',
        occurredAt: '2026-02-01T11:00:00.000Z',
      }),
    ];

    expect(auditSummary(list, now)).toEqual({
      total: 3,
      critical: 1,
      warning: 1,
      info: 1,
      last24h: 2,
    });
  });

  it('scores compliance controls and groups them by framework', () => {
    const controls = [
      control(),
      control({ id: 'c-2', status: 'attention' }),
      control({ id: 'c-3', status: 'failing' }),
      control({ id: 'c-4', framework: 'soc2', status: 'passing' }),
    ];

    expect(complianceScore(controls)).toBe(63);
    expect(complianceScore([])).toBe(100);

    const groups = groupControlsByFramework(controls);
    expect(groups.map((group) => group.framework)).toEqual(['gdpr', 'soc2']);
    expect(groups[0]).toMatchObject({
      passing: 1,
      attention: 1,
      failing: 1,
      score: 50,
    });
    expect(groups[1].score).toBe(100);
  });

  it('exports CSV with escaped quotes', () => {
    const csv = auditEventsToCsv([
      event({ action: 'Exported "Q1" report' }),
    ]);
    const [header, row] = csv.split('\n');

    expect(header).toBe(
      '"occurred_at","severity","category","actor","action","target","ip_address"'
    );
    expect(row).toContain('"Exported ""Q1"" report"');
    expect(row).toContain('"Ayşe Yılmaz"');
  });
});
