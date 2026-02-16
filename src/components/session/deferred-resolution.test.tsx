import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeferredResolution } from './deferred-resolution';

describe('DeferredResolution', () => {
  const defaultProps = {
    stepName: 'Pack lunch',
    plannedDuration: 300,
    onStart: vi.fn(),
    onSkip: vi.fn(),
    onDeferAgain: vi.fn(),
  };

  it('renders step name with ↩ prefix', () => {
    render(<DeferredResolution {...defaultProps} />);
    expect(screen.getByTestId('deferred-step-name')).toHaveTextContent('↩ Pack lunch');
  });

  it('renders planned duration', () => {
    render(<DeferredResolution {...defaultProps} />);
    expect(screen.getByTestId('deferred-step-duration')).toHaveTextContent('5:00');
  });

  it('renders Start, Skip, and Defer again buttons', () => {
    render(<DeferredResolution {...defaultProps} />);
    expect(screen.getByTestId('deferred-start')).toHaveTextContent('▶ Start');
    expect(screen.getByTestId('deferred-skip')).toHaveTextContent('⏭ Skip');
    expect(screen.getByTestId('deferred-defer-again')).toHaveTextContent('↩ Defer again');
  });

  it('fires onStart when Start is clicked', () => {
    render(<DeferredResolution {...defaultProps} />);
    screen.getByTestId('deferred-start').click();
    expect(defaultProps.onStart).toHaveBeenCalledOnce();
  });

  it('fires onSkip when Skip is clicked', () => {
    render(<DeferredResolution {...defaultProps} />);
    screen.getByTestId('deferred-skip').click();
    expect(defaultProps.onSkip).toHaveBeenCalledOnce();
  });

  it('fires onDeferAgain when Defer again is clicked', () => {
    render(<DeferredResolution {...defaultProps} />);
    screen.getByTestId('deferred-defer-again').click();
    expect(defaultProps.onDeferAgain).toHaveBeenCalledOnce();
  });

  it('auto-focuses the Start button', () => {
    render(<DeferredResolution {...defaultProps} />);
    expect(screen.getByTestId('deferred-start')).toHaveFocus();
  });

  it('has ARIA region with correct label', () => {
    render(<DeferredResolution {...defaultProps} />);
    const region = screen.getByTestId('deferred-resolution');
    expect(region).toHaveAttribute('role', 'region');
    expect(region).toHaveAttribute('aria-label', 'Deferred step resolution');
  });
});
