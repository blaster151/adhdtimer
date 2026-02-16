import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeferredBadge } from './deferred-badge';

describe('DeferredBadge', () => {
  it('renders count with deferred text', () => {
    render(<DeferredBadge count={2} />);
    expect(screen.getByTestId('deferred-badge')).toHaveTextContent('2 deferred ↩');
  });

  it('renders count of 1', () => {
    render(<DeferredBadge count={1} />);
    expect(screen.getByTestId('deferred-badge')).toHaveTextContent('1 deferred ↩');
  });

  it('returns null when count is 0', () => {
    const { container } = render(<DeferredBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('uses --deferred color', () => {
    render(<DeferredBadge count={3} />);
    const span = screen.getByText('3 deferred ↩');
    expect(span.style.color).toBe('var(--deferred)');
  });
});
