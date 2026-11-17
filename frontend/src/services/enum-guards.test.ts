import { describe, expect, it } from 'vitest';
import {
  asAccent,
  asActivityType,
  asDecisionStatus,
  asImpact,
  asIntegrationIcon,
  asIntegrationStatus,
  asKnowledgeKind,
  asMeetingPlatform,
  asMeetingStatus,
  asMemberStatus,
  asOrgRole,
  asProjectStatus,
  asTaskPriority,
  asTaskStatus,
} from './enum-guards';

describe('enum guards', () => {
  it('keeps known project and task values', () => {
    expect(asProjectStatus('at_risk')).toBe('at_risk');
    expect(asTaskStatus('in_review')).toBe('in_review');
    expect(asTaskPriority('urgent')).toBe('urgent');
  });

  it('falls back for unknown project and task values', () => {
    expect(asProjectStatus('archived')).toBe('planning');
    expect(asTaskStatus('blocked')).toBe('todo');
    expect(asTaskPriority('critical')).toBe('medium');
  });

  it('normalizes meeting values', () => {
    expect(asMeetingStatus('processing')).toBe('processing');
    expect(asMeetingStatus('unknown')).toBe('scheduled');
    expect(asMeetingPlatform('zoom')).toBe('zoom');
    expect(asMeetingPlatform('webex')).toBe('google_meet');
  });

  it('normalizes workspace roles and membership', () => {
    expect(asOrgRole('owner')).toBe('owner');
    expect(asOrgRole('superadmin')).toBe('member');
    expect(asMemberStatus('invited')).toBe('invited');
    expect(asMemberStatus('offline')).toBe('active');
  });

  it('normalizes accents and knowledge kinds', () => {
    expect(asAccent('emerald')).toBe('emerald');
    expect(asAccent(null)).toBe('blue');
    expect(asAccent('rainbow')).toBe('blue');
    expect(asKnowledgeKind('transcript')).toBe('transcript');
    expect(asKnowledgeKind('memo')).toBe('document');
  });

  it('normalizes integrations, activity and impact', () => {
    expect(asIntegrationStatus('connected')).toBe('connected');
    expect(asIntegrationStatus('pending')).toBe('available');
    expect(asIntegrationIcon('calendar')).toBe('calendar');
    expect(asIntegrationIcon('chat')).toBe('chat');
    expect(asIntegrationIcon('slack')).toBe('video');
    expect(asActivityType('decision')).toBe('decision');
    expect(asActivityType('reaction')).toBe('task');
    expect(asImpact('high')).toBe('high');
    expect(asImpact('critical')).toBe('medium');
  });

  it('normalizes decision status', () => {
    expect(asDecisionStatus('accepted')).toBe('accepted');
    expect(asDecisionStatus('pending')).toBe('proposed');
  });
});
