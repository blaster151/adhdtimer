import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TransitionOverlay } from './transition-overlay';

describe('TransitionOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders step name and position when visible', () => {
    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="Right on track"
        paceStatus="on-track"
        visible={true}
      />,
    );
    expect(screen.getByText('Time to start Shower')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('Right on track')).toBeInTheDocument();
  });

  it('renders nothing when not visible', () => {
    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="Right on track"
        paceStatus="on-track"
        visible={false}
      />,
    );
    expect(screen.queryByTestId('transition-overlay')).not.toBeInTheDocument();
  });

  it('has pointer-events-none so controls remain clickable', () => {
    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="1 min ahead"
        paceStatus="ahead"
        visible={true}
      />,
    );
    const overlay = screen.getByTestId('transition-overlay');
    expect(overlay.className).toContain('pointer-events-none');
  });

  it('has aria-live polite region for screen readers', () => {
    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="Right on track"
        paceStatus="on-track"
        visible={true}
      />,
    );
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('displays pace message with ahead styling', () => {
    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="2 min ahead — nice pace"
        paceStatus="ahead"
        visible={true}
      />,
    );
    expect(screen.getByText('2 min ahead — nice pace')).toBeInTheDocument();
  });

  it('displays pace message with behind styling (no alarm language)', () => {
    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="3 min behind"
        paceStatus="behind"
        visible={true}
      />,
    );
    const paceEl = screen.getByText('3 min behind');
    expect(paceEl).toBeInTheDocument();
    // No alarming language
    expect(paceEl.textContent).not.toContain('!');
    expect(paceEl.textContent).not.toContain('warning');
    expect(paceEl.textContent).not.toContain('late');
  });

  it('auto-hides after ~4 seconds', () => {
    vi.useFakeTimers();

    render(
      <TransitionOverlay
        stepName="Shower"
        stepNumber={2}
        totalSteps={5}
        paceMessage="Right on track"
        paceStatus="on-track"
        visible={true}
      />,
    );

    expect(screen.getByTestId('transition-overlay')).toBeInTheDocument();

    // Advance past the 4s auto-hide
    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByTestId('transition-overlay')).not.toBeInTheDocument();
  });
});
