import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteDialog } from './delete-dialog';

describe('DeleteDialog', () => {
  it('renders timer name in title', () => {
    render(
      <DeleteDialog
        open={true}
        timerName="Morning Routine"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText((content, element) =>
      element?.tagName === 'H2' && /Morning Routine/.test(content),
    )).toBeInTheDocument();
  });

  it('renders warning description', () => {
    render(
      <DeleteDialog
        open={true}
        timerName="Morning Routine"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
  });

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteDialog
        open={true}
        timerName="Morning Routine"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(
      <DeleteDialog
        open={true}
        timerName="Morning Routine"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not render content when closed', () => {
    render(
      <DeleteDialog
        open={false}
        timerName="Morning Routine"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Delete "Morning Routine"\?/)).not.toBeInTheDocument();
  });
});
