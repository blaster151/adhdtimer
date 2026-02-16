import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ManualAdvanceButton } from './manual-advance-button';

describe('ManualAdvanceButton', () => {
  const defaultProps = {
    nextStepName: 'Breakfast',
    onStart: vi.fn(),
    onSkip: vi.fn(),
    onStop: vi.fn(),
  };

  it('renders Start button with step name', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    expect(screen.getByTestId('manual-advance-start')).toHaveTextContent('▶ Start Breakfast');
  });

  it('renders Skip and Stop ghost buttons', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    expect(screen.getByTestId('manual-advance-skip')).toHaveTextContent('⏭ Skip');
    expect(screen.getByTestId('manual-advance-stop')).toHaveTextContent('⏹ Stop');
  });

  it('fires onStart when Start is clicked', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    screen.getByTestId('manual-advance-start').click();
    expect(defaultProps.onStart).toHaveBeenCalledOnce();
  });

  it('fires onSkip when Skip is clicked', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    screen.getByTestId('manual-advance-skip').click();
    expect(defaultProps.onSkip).toHaveBeenCalledOnce();
  });

  it('fires onStop when Stop is clicked', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    screen.getByTestId('manual-advance-stop').click();
    expect(defaultProps.onStop).toHaveBeenCalledOnce();
  });

  it('has auto-focused Start button', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    expect(screen.getByTestId('manual-advance-start')).toHaveFocus();
  });

  it('has ARIA announcement for screen readers', () => {
    render(<ManualAdvanceButton {...defaultProps} />);
    const announcement = screen.getByText(
      'Step complete. Next step: Breakfast. Activate Start button to begin.',
    );
    expect(announcement).toBeInTheDocument();
  });
});
