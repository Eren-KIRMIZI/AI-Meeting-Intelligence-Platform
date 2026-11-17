import { describe, expect, it } from 'vitest';
import { decisionActions, decisionActivityTitle } from './decisions';
import type { DecisionStatus } from '@/types';

const statuses: DecisionStatus[] = [
  'proposed',
  'accepted',
  'rejected',
  'superseded',
];

describe('decisionActions', () => {
  it('offers accept, reject and supersede for a proposed decision', () => {
    expect(decisionActions('proposed').map((action) => action.key)).toEqual([
      'accept',
      'reject',
      'supersede',
    ]);
  });

  it('offers reopen once a decision has moved on', () => {
    expect(decisionActions('accepted').map((action) => action.key)).toEqual([
      'reject',
      'supersede',
      'reopen',
    ]);
    expect(decisionActions('rejected').map((action) => action.key)).toEqual([
      'accept',
      'supersede',
      'reopen',
    ]);
    expect(decisionActions('superseded').map((action) => action.key)).toEqual([
      'accept',
      'reject',
      'reopen',
    ]);
  });

  it('never offers an action that keeps the current status', () => {
    for (const status of statuses) {
      expect(decisionActions(status).some((action) => action.target === status)).toBe(
        false
      );
    }
  });
});

describe('decisionActivityTitle', () => {
  it('labels every status transition', () => {
    expect(decisionActivityTitle('accepted')).toBe('Decision accepted');
    expect(decisionActivityTitle('rejected')).toBe('Decision rejected');
    expect(decisionActivityTitle('superseded')).toBe('Decision superseded');
    expect(decisionActivityTitle('proposed')).toBe('Decision reopened');
  });
});
