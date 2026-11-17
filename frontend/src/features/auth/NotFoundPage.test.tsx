import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('explains the error and offers a way back', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Error 404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'This page is not on the map',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /back to overview/i })
    ).toHaveAttribute('href', '/overview');
    expect(
      screen.getByRole('link', { name: /browse meetings/i })
    ).toHaveAttribute('href', '/meetings');
  });
});
