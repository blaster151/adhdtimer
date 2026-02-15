import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepListEditor } from './step-list-editor';
import type { Step } from '@/types/timer';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2),
});

// Mock @dnd-kit to avoid complex drag setup in unit tests
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  },
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

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

  it('shows duration formatted', () => {
    render(<StepListEditor steps={defaultSteps} onChange={vi.fn()} />);
    // 1500 seconds = "25:00"
    expect(screen.getByText('25:00')).toBeInTheDocument();
    // 300 seconds = "5:00"
    expect(screen.getByText('5:00')).toBeInTheDocument();
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

  it('renders drag handles for each step', () => {
    render(<StepListEditor steps={defaultSteps} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Reorder step 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Reorder step 2')).toBeInTheDocument();
  });

  it('opens tap-to-type input when duration is clicked', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Step 1 duration'));
    expect(screen.getByLabelText('Step 1 duration input')).toBeInTheDocument();
  });

  it('commits valid duration on Enter in tap-to-type input', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    // Click duration to open editor
    fireEvent.click(screen.getByLabelText('Step 1 duration'));
    const input = screen.getByLabelText('Step 1 duration input');
    fireEvent.change(input, { target: { value: '10m' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall[0].plannedDuration).toBe(600); // 10 minutes
  });

  it('reverts invalid duration on blur in tap-to-type input', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Step 1 duration'));
    const input = screen.getByLabelText('Step 1 duration input');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    // onChange should not have been called with a bad value
    // The duration display should return to showing the formatted duration
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('moves step up via keyboard on drag handle', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    const handle = screen.getByLabelText('Reorder step 2');
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0];
    expect(newSteps[0].name).toBe('Break');
    expect(newSteps[1].name).toBe('Focus');
  });

  it('moves step down via keyboard on drag handle', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    const handle = screen.getByLabelText('Reorder step 1');
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledOnce();
    const newSteps = onChange.mock.calls[0][0];
    expect(newSteps[0].name).toBe('Break');
    expect(newSteps[1].name).toBe('Focus');
  });

  it('does not move first step up', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    const handle = screen.getByLabelText('Reorder step 1');
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not move last step down', () => {
    const onChange = vi.fn();
    render(<StepListEditor steps={defaultSteps} onChange={onChange} />);
    const handle = screen.getByLabelText('Reorder step 2');
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
