import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepListEditor } from './step-list-editor';
import type { Step } from '@/types/timer';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2),
});

describe('StepListEditor', () => {
  const defaultSteps: Step[] = [
    { id: 'step-1', name: 'Focus', plannedDuration: 1500 },
    { id: 'step-2', name: 'Break', plannedDuration: 300 },
  ];

  it('renders existing steps', () => {
    render(<StepListEditor steps={defaultSteps} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Focus')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Break')).toBeInTheDocument();
  });

  it('shows duration in minutes', () => {
    render(<StepListEditor steps={defaultSteps} onChange={vi.fn()} />);
    // 1500 seconds = 25 minutes
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    // 300 seconds = 5 minutes
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('shows empty message when no steps', () => {
    render(<StepListEditor steps={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument();
  });

  it('calls onChange with new step when Add Step is clicked', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add Step'));
    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0];
    expect(newSteps).toHaveLength(3);
    expect(newSteps[2].plannedDuration).toBe(300); // 5 min default
  });

  it('calls onChange without step when remove is clicked', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove step 1'));
    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0];
    expect(newSteps).toHaveLength(1);
    expect(newSteps[0].name).toBe('Break');
  });

  it('updates step name on input change', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Step 1 name'), { target: { value: 'Deep Focus' } });
    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0];
    expect(newSteps[0].name).toBe('Deep Focus');
  });

  it('updates step duration on input change', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Step 1 duration'), { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0];
    expect(newSteps[0].plannedDuration).toBe(1800); // 30 * 60
  });
});
