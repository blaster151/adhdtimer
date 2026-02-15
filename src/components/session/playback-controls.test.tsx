import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaybackControls } from './playback-controls';

describe('PlaybackControls', () => {
  it('shows Pause button when running', () => {
    render(
      <PlaybackControls
        isRunning={true}
        isPaused={false}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    expect(screen.queryByLabelText('Resume')).not.toBeInTheDocument();
  });

  it('shows Resume button when paused', () => {
    render(
      <PlaybackControls
        isRunning={false}
        isPaused={true}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Resume')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pause')).not.toBeInTheDocument();
  });

  it('calls onPause when Pause is clicked', () => {
    const onPause = vi.fn();
    render(
      <PlaybackControls
        isRunning={true}
        isPaused={false}
        isCompleted={false}
        isLastStep={false}
        onPause={onPause}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Pause'));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it('calls onResume when Resume is clicked', () => {
    const onResume = vi.fn();
    render(
      <PlaybackControls
        isRunning={false}
        isPaused={true}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={onResume}
        onSkip={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Resume'));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('calls onSkip when Skip is clicked', () => {
    const onSkip = vi.fn();
    render(
      <PlaybackControls
        isRunning={true}
        isPaused={false}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={onSkip}
        onStop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Skip step'));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('calls onStop when Stop is clicked', () => {
    const onStop = vi.fn();
    render(
      <PlaybackControls
        isRunning={true}
        isPaused={false}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={onStop}
      />,
    );
    fireEvent.click(screen.getByLabelText('Stop timer'));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('renders nothing when completed', () => {
    const { container } = render(
      <PlaybackControls
        isRunning={false}
        isPaused={false}
        isCompleted={true}
        isLastStep={true}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows extension buttons when onExtend is provided', () => {
    const onExtend = vi.fn();
    render(
      <PlaybackControls
        isRunning={true}
        isPaused={false}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
        onExtend={onExtend}
      />,
    );
    expect(screen.getByLabelText('Add 1 minute')).toBeInTheDocument();
    expect(screen.getByLabelText('Add 5 minutes')).toBeInTheDocument();
  });

  it('calls onExtend with correct seconds', () => {
    const onExtend = vi.fn();
    render(
      <PlaybackControls
        isRunning={true}
        isPaused={false}
        isCompleted={false}
        isLastStep={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
        onExtend={onExtend}
      />,
    );
    fireEvent.click(screen.getByLabelText('Add 1 minute'));
    expect(onExtend).toHaveBeenCalledWith(60);
    fireEvent.click(screen.getByLabelText('Add 5 minutes'));
    expect(onExtend).toHaveBeenCalledWith(300);
  });
});
