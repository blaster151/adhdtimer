import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepDots } from './step-dots';
import type { SessionStep } from '@/types/session';

function makeStep(overrides: Partial<SessionStep> & { id: string; name: string }): SessionStep {
  return {
    plannedDuration: 300,
    originalPlannedDuration: 300,
    elapsedTime: 0,
    status: 'pending',
    ...overrides,
  };
}

describe('StepDots', () => {
  const steps: SessionStep[] = [
    makeStep({ id: 's1', name: 'Shower', status: 'completed', elapsedTime: 290 }),
    makeStep({ id: 's2', name: 'Dress', status: 'running', elapsedTime: 120 }),
    makeStep({ id: 's3', name: 'Breakfast', status: 'pending' }),
    makeStep({ id: 's4', name: 'Pack', status: 'pending' }),
  ];

  it('renders correct number of dots', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    expect(screen.getByTestId('step-dot-0')).toBeInTheDocument();
    expect(screen.getByTestId('step-dot-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-dot-2')).toBeInTheDocument();
    expect(screen.getByTestId('step-dot-3')).toBeInTheDocument();
  });

  it('has role="list" with aria-label showing progress', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const container = screen.getByTestId('step-dots');
    expect(container).toHaveAttribute('role', 'list');
    expect(container).toHaveAttribute('aria-label', 'Timer progress: step 2 of 4');
  });

  it('marks completed dots with aria-label including (completed)', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const dot0 = screen.getByTestId('step-dot-0');
    expect(dot0.getAttribute('aria-label')).toContain('completed');
  });

  it('marks current dot with aria-label including (current)', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const dot1 = screen.getByTestId('step-dot-1');
    expect(dot1.getAttribute('aria-label')).toContain('current');
  });

  it('marks upcoming dots with aria-label including (upcoming)', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const dot2 = screen.getByTestId('step-dot-2');
    expect(dot2.getAttribute('aria-label')).toContain('upcoming');
  });

  it('current dot is larger than completed and upcoming dots', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const dot0 = screen.getByTestId('step-dot-0');
    const dot1 = screen.getByTestId('step-dot-1');
    const dot2 = screen.getByTestId('step-dot-2');
    // Completed and upcoming are h-2.5, current is h-3
    expect(dot0.className).toContain('h-2.5');
    expect(dot1.className).toContain('h-3');
    expect(dot2.className).toContain('h-2.5');
  });

  it('marks skipped dots with aria-label including (skipped)', () => {
    const stepsWithSkipped: SessionStep[] = [
      makeStep({ id: 's1', name: 'Shower', status: 'completed', elapsedTime: 290 }),
      makeStep({ id: 's2', name: 'Dress', status: 'skipped' }),
      makeStep({ id: 's3', name: 'Breakfast', status: 'running', elapsedTime: 60 }),
    ];
    render(<StepDots steps={stepsWithSkipped} currentIndex={2} />);
    const dot1 = screen.getByTestId('step-dot-1');
    expect(dot1.getAttribute('aria-label')).toContain('skipped');
  });

  it('completed dot has filled primary styling', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const dot0 = screen.getByTestId('step-dot-0');
    expect(dot0.className).toContain('bg-primary');
  });

  it('current dot has border ring styling', () => {
    render(<StepDots steps={steps} currentIndex={1} />);
    const dot1 = screen.getByTestId('step-dot-1');
    expect(dot1.className).toContain('border-2');
    expect(dot1.className).toContain('border-primary');
  });

  it('deferred dot uses --deferred color with dimmed opacity', () => {
    const stepsWithDeferred: SessionStep[] = [
      makeStep({ id: 's1', name: 'Shower', status: 'completed', elapsedTime: 290 }),
      makeStep({ id: 's2', name: 'Dress', status: 'deferred' }),
      makeStep({ id: 's3', name: 'Breakfast', status: 'running', elapsedTime: 60 }),
    ];
    render(<StepDots steps={stepsWithDeferred} currentIndex={2} />);
    const dot1 = screen.getByTestId('step-dot-1');
    expect(dot1.getAttribute('aria-label')).toContain('deferred');
    expect(dot1.className).toContain('opacity-40');
  });
});
