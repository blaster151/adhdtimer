'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'adhd-timer-tts-enabled';

export interface UseTTSReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSupported: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

function getStoredEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true; // default: enabled
    return stored === 'true';
  } catch {
    return true;
  }
}

export function useTTS(): UseTTSReturn {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isEnabled, setEnabledState] = useState(getStoredEnabled);
  const enabledRef = useRef(isEnabled);

  useEffect(() => {
    enabledRef.current = isEnabled;
  }, [isEnabled]);

  const setEnabled = useCallback((enabled: boolean) => {
    setEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // localStorage may be unavailable — ignore
    }
  }, []);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    try {
      speechSynthesis.cancel();
    } catch {
      // Ignore errors
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !enabledRef.current) return;
      try {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
      } catch {
        // Graceful degradation — never throw
      }
    },
    [isSupported],
  );

  return {
    speak,
    cancel,
    isSupported,
    isEnabled,
    setEnabled,
  };
}
