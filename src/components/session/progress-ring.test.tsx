import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from './progress-ring';

const baseProps = {
  stepProgress: 0.5,
  totalProgress: 0.25,
  stepName: 'Shower',
  elapsedDisplay: '5:00',
  paceMessage: 'Right on track',
  paceStatus: 'on-track' as const,
  isOverrun: false,
  isPaused: false,
  stepNumber: 2,
  totalSteps: 5,
  timerName: 'Morning Routine',
  ariaElapsedLabel: '5 minutes elapsed',
};

describe('ProgressRing', () => {
  it('renders SVG with correct role and aria-label', () => {
    render(<ProgressRing {...baseProps} />);
    const svg = screen.getByTestId('progress-ring');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg.getAttribute('aria-label')).toContain('Morning Routine progress');
    expect(svg.getAttribute('aria-label')).toContain('step 2 of 5');
    expect(svg.getAttribute('aria-label')).toContain('Shower');
    expect(svg.getAttribute('aria-label')).toContain('5 minutes elapsed');
    expect(svg.getAttribute('aria-label')).toContain('Right on track');
  });

  it('displays step name in ring center', () => {
    render(<ProgressRing {...baseProps} />);
    expect(screen.getByTestId('ring-step-name')).toHaveTextContent('Shower');
  });

  it('displays elapsed time in ring center', () => {
    render(<ProgressRing {...baseProps} />);
    expect(screen.getByTestId('ring-time-display')).toHaveTextContent('5:00');
  });

  it('displays pace message', () => {
    render(<ProgressRing {...baseProps} />);
    expect(screen.getByTestId('ring-pace-message')).toHaveTextContent('Right on track');
  });

  it('uses on-track color for on-track pace', () => {
    render(<ProgressRing {...baseProps} paceStatus="on-track" />);
    const outerProgress = screen.getByTestId('outer-progress');
    expect(outerProgress).toHaveAttribute('stroke', 'var(--on-track)');
  });

  it('uses ahead color for ahead pace', () => {
    render(<ProgressRing {...baseProps} paceStatus="ahead" />);
    const outerProgress = screen.getByTestId('outer-progress');
    expect(outerProgress).toHaveAttribute('stroke', 'var(--ahead)');
  });

  it('uses behind color when overrunning', () => {
    render(<ProgressRing {...baseProps} isOverrun paceStatus="on-track" />);
    const innerProgress = screen.getByTestId('inner-progress');
    expect(innerProgress).toHaveAttribute('stroke', 'var(--behind)');
  });

  it('shows PAUSED label when paused', () => {
    render(<ProgressRing {...baseProps} isPaused />);
    expect(screen.getByTestId('ring-paused-label')).toHaveTextContent('PAUSED');
  });

  it('does not show PAUSED label when running', () => {
    render(<ProgressRing {...baseProps} isPaused={false} />);
    expect(screen.queryByTestId('ring-paused-label')).not.toBeInTheDocument();
  });

  it('renders all four ring circles', () => {
    render(<ProgressRing {...baseProps} />);
    expect(screen.getByTestId('outer-track')).toBeInTheDocument();
    expect(screen.getByTestId('outer-progress')).toBeInTheDocument();
    expect(screen.getByTestId('inner-track')).toBeInTheDocument();
    expect(screen.getByTestId('inner-progress')).toBeInTheDocument();
  });

  it('clamps progress to 0-1 range', () => {
    render(<ProgressRing {...baseProps} stepProgress={1.5} totalProgress={-0.5} />);
    const innerProgress = screen.getByTestId('inner-progress');
    const outerProgress = screen.getByTestId('outer-progress');
    // Inner at 100% = offset 0
    const innerCircumference = 2 * Math.PI * 108;
    expect(innerProgress.getAttribute('stroke-dashoffset')).toBe('0');
    // Outer at 0% = offset = full circumference
    const outerCircumference = 2 * Math.PI * 130;
    expect(outerProgress.getAttribute('stroke-dashoffset')).toBe(String(outerCircumference));
  });

  it('has responsive container width classes', () => {
    render(<ProgressRing {...baseProps} />);
    const container = screen.getByTestId('progress-ring-container');
    expect(container.className).toContain('w-[260px]');
    expect(container.className).toContain('sm:w-[280px]');
    expect(container.className).toContain('lg:w-[300px]');
  });

  it('renders correct stroke-dasharray values', () => {
    render(<ProgressRing {...baseProps} />);
    const outerProgress = screen.getByTestId('outer-progress');
    const innerProgress = screen.getByTestId('inner-progress');
    expect(outerProgress.getAttribute('stroke-dasharray')).toBe(String(2 * Math.PI * 130));
    expect(innerProgress.getAttribute('stroke-dasharray')).toBe(String(2 * Math.PI * 108));
  });
});
