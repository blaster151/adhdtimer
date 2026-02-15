import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ObserverBanner } from './observer-banner';

describe('ObserverBanner', () => {
  it('renders "Controlled from another device" text', () => {
    render(<ObserverBanner onTakeControl={vi.fn()} />);
    expect(
      screen.getByText('Controlled from another device'),
    ).toBeInTheDocument();
  });

  it('renders "Take Control" button', () => {
    render(<ObserverBanner onTakeControl={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Take Control' })).toBeInTheDocument();
  });

  it('calls onTakeControl when button is clicked', () => {
    const onTakeControl = vi.fn();
    render(<ObserverBanner onTakeControl={onTakeControl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Take Control' }));
    expect(onTakeControl).toHaveBeenCalledOnce();
  });

  it('has a status role for screen readers', () => {
    render(<ObserverBanner onTakeControl={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('Take Control fires immediately without confirmation dialog', () => {
    const onTakeControl = vi.fn();
    render(<ObserverBanner onTakeControl={onTakeControl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Take Control' }));
    expect(onTakeControl).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('has data-testid for integration tests', () => {
    render(<ObserverBanner onTakeControl={vi.fn()} />);
    expect(screen.getByTestId('observer-banner')).toBeInTheDocument();
  });
});
