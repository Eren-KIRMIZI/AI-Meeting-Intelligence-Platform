import type { DecisionStatus } from '@/types';

export type DecisionActionKey = 'accept' | 'reject' | 'supersede' | 'reopen';

export interface DecisionAction {
  key: DecisionActionKey;
  label: string;
  target: DecisionStatus;
  description: string;
}

const actionMeta: Record<DecisionActionKey, DecisionAction> = {
  accept: {
    key: 'accept',
    label: 'Accept',
    target: 'accepted',
    description: 'Close the decision and make it the working plan.',
  },
  reject: {
    key: 'reject',
    label: 'Reject',
    target: 'rejected',
    description: 'Record that this option was not chosen.',
  },
  supersede: {
    key: 'supersede',
    label: 'Supersede',
    target: 'superseded',
    description: 'Mark it as replaced by a newer decision.',
  },
  reopen: {
    key: 'reopen',
    label: 'Reopen',
    target: 'proposed',
    description: 'Send it back for another review.',
  },
};

const actionOrder: Record<DecisionStatus, DecisionActionKey[]> = {
  proposed: ['accept', 'reject', 'supersede'],
  accepted: ['reject', 'supersede', 'reopen'],
  rejected: ['accept', 'supersede', 'reopen'],
  superseded: ['accept', 'reject', 'reopen'],
};

/** Actions that move a decision out of its current status, in priority order. */
export function decisionActions(status: DecisionStatus): DecisionAction[] {
  return actionOrder[status].map((key) => actionMeta[key]);
}

const activityTitles: Record<DecisionStatus, string> = {
  proposed: 'Decision reopened',
  accepted: 'Decision accepted',
  rejected: 'Decision rejected',
  superseded: 'Decision superseded',
};

export function decisionActivityTitle(status: DecisionStatus): string {
  return activityTitles[status];
}
