import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeferButton } from './defer-button';

describe('DeferButton', () => {
  it('renders with "↩ Defer" text', () => {
    render(<DeferButton onDefer={vi.fn()} />);
    expect(screen.getByTestId('defer-button')).toHaveTextContent('↩ Defer');
  });

  it('fires onDefer when clicked', () => {
    const onDefer = vi.fn();
    render(<DeferButton onDefer={onDefer} />);
    screen.getByTestId('defer-button').click();
    expect(onDefer).toHaveBeenCalledOnce();
  });

  it('has aria-label "Defer step"', () => {
    render(<DeferButton onDefer={vi.fn()} />);
    expect(screen.getByTestId('defer-button')).toHaveAttribute('aria-label', 'Defer step');
  });

  it('is disabled when disabled prop is true', () => {
    render(<DeferButton onDefer={vi.fn()} disabled />);
    expect(screen.getByTestId('defer-button')).toBeDisabled();
  });

  it('does not fire onDefer when disabled', () => {
    const onDefer = vi.fn();
    render(<DeferButton onDefer={onDefer} disabled />);
    screen.getByTestId('defer-button').click();
    expect(onDefer).not.toHaveBeenCalled();
  });
});
