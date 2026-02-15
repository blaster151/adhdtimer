export type BreakdownStep = {
  name: string;
  durationMinutes: number;
};

export type BreakdownResult = {
  timerName: string;
  steps: BreakdownStep[];
};

/**
 * Validates and normalizes the raw JSON output from an LLM into a BreakdownResult.
 * Returns { data, error } tuple — never throws.
 */
export function validateBreakdownResponse(raw: unknown): {
  data: BreakdownResult | null;
  error: string | null;
} {
  if (typeof raw !== 'object' || raw === null) {
    return { data: null, error: 'Response is not an object' };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.timerName !== 'string' || obj.timerName.trim() === '') {
    return { data: null, error: 'Missing or invalid timerName' };
  }

  if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
    return { data: null, error: 'Missing or empty steps array' };
  }

  if (obj.steps.length > 12) {
    return { data: null, error: 'Too many steps (max 12)' };
  }

  const steps: BreakdownStep[] = [];

  for (let i = 0; i < obj.steps.length; i++) {
    const step = obj.steps[i] as Record<string, unknown>;

    if (typeof step !== 'object' || step === null) {
      return { data: null, error: `Step ${i} is not an object` };
    }

    if (typeof step.name !== 'string' || step.name.trim() === '') {
      return { data: null, error: `Step ${i} has missing or invalid name` };
    }

    if (typeof step.durationMinutes !== 'number' || isNaN(step.durationMinutes)) {
      return { data: null, error: `Step ${i} has missing or invalid durationMinutes` };
    }

    // Clamp durations: minimum 1 minute, maximum 120 minutes
    const clamped = Math.min(120, Math.max(1, Math.round(step.durationMinutes)));

    steps.push({ name: step.name.trim(), durationMinutes: clamped });
  }

  return {
    data: { timerName: obj.timerName.trim(), steps },
    error: null,
  };
}
