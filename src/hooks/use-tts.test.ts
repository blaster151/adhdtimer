import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTTS } from './use-tts';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

// Mock speechSynthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
vi.stubGlobal('speechSynthesis', {
  speak: mockSpeak,
  cancel: mockCancel,
});

// Mock SpeechSynthesisUtterance
const mockUtteranceInstances: Array<{ text: string; rate: number; pitch: number }> = [];
vi.stubGlobal(
  'SpeechSynthesisUtterance',
  class MockUtterance {
    text: string;
    rate = 1.0;
    pitch = 1.0;
    constructor(text: string) {
      this.text = text;
      mockUtteranceInstances.push(this);
    }
  },
);

describe('useTTS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUtteranceInstances.length = 0;
    // Reset storage
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('detects speechSynthesis support', () => {
    const { result } = renderHook(() => useTTS());
    expect(result.current.isSupported).toBe(true);
  });

  it('defaults to enabled when no localStorage value', () => {
    const { result } = renderHook(() => useTTS());
    expect(result.current.isEnabled).toBe(true);
  });

  it('reads enabled state from localStorage', () => {
    mockStorage['adhd-timer-tts-enabled'] = 'false';
    const { result } = renderHook(() => useTTS());
    expect(result.current.isEnabled).toBe(false);
  });

  it('speak calls speechSynthesis.speak with correct utterance', () => {
    const { result } = renderHook(() => useTTS());
    act(() => {
      result.current.speak('Shower. 8 minutes.');
    });
    expect(mockCancel).toHaveBeenCalledOnce();
    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockUtteranceInstances).toHaveLength(1);
    expect(mockUtteranceInstances[0].text).toBe('Shower. 8 minutes.');
    expect(mockUtteranceInstances[0].rate).toBe(1.0);
    expect(mockUtteranceInstances[0].pitch).toBe(1.0);
  });

  it('speak does nothing when disabled', () => {
    mockStorage['adhd-timer-tts-enabled'] = 'false';
    const { result } = renderHook(() => useTTS());
    act(() => {
      result.current.speak('Shower. 8 minutes.');
    });
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('setEnabled persists to localStorage', () => {
    const { result } = renderHook(() => useTTS());
    act(() => {
      result.current.setEnabled(false);
    });
    expect(result.current.isEnabled).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'adhd-timer-tts-enabled',
      'false',
    );
  });

  it('setEnabled to true re-enables speaking', () => {
    mockStorage['adhd-timer-tts-enabled'] = 'false';
    const { result } = renderHook(() => useTTS());

    // Disabled — speak should be no-op
    act(() => {
      result.current.speak('Test');
    });
    expect(mockSpeak).not.toHaveBeenCalled();

    // Enable
    act(() => {
      result.current.setEnabled(true);
    });

    // Now speak should work
    act(() => {
      result.current.speak('Shower. 8 minutes.');
    });
    expect(mockSpeak).toHaveBeenCalledOnce();
  });

  it('cancel calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useTTS());
    act(() => {
      result.current.cancel();
    });
    expect(mockCancel).toHaveBeenCalledOnce();
  });

  it('speak cancels ongoing speech before speaking', () => {
    const { result } = renderHook(() => useTTS());
    act(() => {
      result.current.speak('Step one.');
    });
    // cancel should be called before speak
    expect(mockCancel).toHaveBeenCalledOnce();
    expect(mockSpeak).toHaveBeenCalledOnce();
  });

  it('handles speechSynthesis.speak throwing gracefully', () => {
    mockSpeak.mockImplementationOnce(() => {
      throw new Error('Speech error');
    });
    const { result } = renderHook(() => useTTS());
    // Should not throw
    expect(() => {
      act(() => {
        result.current.speak('Test');
      });
    }).not.toThrow();
  });
});
