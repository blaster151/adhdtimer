import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('EmptyState', () => {
  it('renders the heading', () => {
    render(<EmptyState />);
    expect(screen.getByText('Create your first timer')).toBeInTheDocument();
  });

  it('renders the CTA button', () => {
    render(<EmptyState />);
    expect(screen.getByRole('link', { name: 'Create Timer' })).toBeInTheDocument();
  });

  it('links to the new timer page', () => {
    render(<EmptyState />);
    const link = screen.getByRole('link', { name: 'Create Timer' });
    expect(link).toHaveAttribute('href', '/app/timers/new');
  });
});
