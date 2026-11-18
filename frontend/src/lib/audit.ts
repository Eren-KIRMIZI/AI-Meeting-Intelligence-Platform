import type {
  AuditEvent,
  AuditFilters,
  ComplianceControl,
  ComplianceFramework,
} from '@/types';
import { normalizeText, tokenize } from '@/lib/search';

const DAY_MS = 86_400_000;

export function emptyAuditFilters(): AuditFilters {
  return { query: '', category: 'all', severity: 'all', days: null };
}

function auditText(event: AuditEvent): string {
  return [
    event.action,
    event.target,
    event.actor.fullName,
    event.actor.email,
    event.metadata ?? '',
    event.ipAddress ?? '',
  ].join(' ');
}

/**
 * Applies the query, category, severity and recency filters used by the audit
 * log. Recency is measured against `now` so tests stay deterministic.
 */
export function filterAuditEvents(
  events: AuditEvent[],
  filters: AuditFilters,
  now: Date | string = new Date()
): AuditEvent[] {
  const tokens = tokenize(filters.query);
  const cutoff =
    filters.days === null
      ? null
      : new Date(now).getTime() - filters.days * DAY_MS;

  return events
    .filter((event) => {
      if (filters.category !== 'all' && event.category !== filters.category) {
        return false;
      }
      if (filters.severity !== 'all' && event.severity !== filters.severity) {
        return false;
      }
      if (cutoff !== null && new Date(event.occurredAt).getTime() < cutoff) {
        return false;
      }
      if (tokens.length === 0) return true;
      const haystack = normalizeText(auditText(event));
      return tokens.every((token) => haystack.includes(token));
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
}

export interface AuditSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  last24h: number;
}

export function auditSummary(
  events: AuditEvent[],
  now: Date | string = new Date()
): AuditSummary {
  const current = new Date(now).getTime();

  return events.reduce<AuditSummary>(
    (summary, event) => {
      summary.total += 1;
      summary[event.severity] += 1;
      if (current - new Date(event.occurredAt).getTime() <= DAY_MS) {
        summary.last24h += 1;
      }
      return summary;
    },
    { total: 0, critical: 0, warning: 0, info: 0, last24h: 0 }
  );
}

/**
 * Compliance score out of 100. A passing control is worth a full point, an
 * attention control half a point and a failing control nothing.
 */
export function complianceScore(controls: ComplianceControl[]): number {
  if (controls.length === 0) return 100;
  const earned = controls.reduce((total, control) => {
    if (control.status === 'passing') return total + 1;
    if (control.status === 'attention') return total + 0.5;
    return total;
  }, 0);
  return Math.round((earned / controls.length) * 100);
}

export interface ComplianceGroup {
  framework: ComplianceFramework;
  controls: ComplianceControl[];
  score: number;
  passing: number;
  attention: number;
  failing: number;
}

export function groupControlsByFramework(
  controls: ComplianceControl[]
): ComplianceGroup[] {
  const frameworks: ComplianceFramework[] = ['gdpr', 'soc2', 'iso27001', 'hipaa'];

  return frameworks
    .map((framework) => {
      const list = controls.filter((control) => control.framework === framework);
      return {
        framework,
        controls: list,
        score: complianceScore(list),
        passing: list.filter((control) => control.status === 'passing').length,
        attention: list.filter((control) => control.status === 'attention')
          .length,
        failing: list.filter((control) => control.status === 'failing').length,
      };
    })
    .filter((group) => group.controls.length > 0);
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** RFC 4180-friendly export of the filtered audit log. */
export function auditEventsToCsv(events: AuditEvent[]): string {
  const header = [
    'occurred_at',
    'severity',
    'category',
    'actor',
    'action',
    'target',
    'ip_address',
  ];
  const rows = events.map((event) => [
    event.occurredAt,
    event.severity,
    event.category,
    event.actor.fullName,
    event.action,
    event.target,
    event.ipAddress ?? '',
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => csvCell(String(cell))).join(','))
    .join('\n');
}
