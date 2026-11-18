import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './segmented-control';

type Filter = 'upcoming' | 'past';

function Harness() {
  const [value, setValue] = useState<Filter>('upcoming');
  return (
    <SegmentedControl
      value={value}
      onValueChange={setValue}
      label="Meeting timeline"
      options={[
        { value: 'upcoming', label: 'Upcoming', count: 3 },
        { value: 'past', label: 'Past briefs', count: 1 },
      ]}
    />
  );
}

describe('SegmentedControl', () => {
  it('exposes a labelled group with pressed state', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const group = screen.getByRole('group', { name: 'Meeting timeline' });
    expect(group).toBeInTheDocument();

    const upcoming = screen.getByRole('button', { name: /upcoming\s*3/i });
    const past = screen.getByRole('button', { name: /past briefs\s*1/i });

    expect(upcoming).toHaveAttribute('aria-pressed', 'true');
    expect(past).toHaveAttribute('aria-pressed', 'false');

    await user.click(past);

    expect(past).toHaveAttribute('aria-pressed', 'true');
    expect(upcoming).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not render tab semantics that require a panel', () => {
    render(<Harness />);
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
