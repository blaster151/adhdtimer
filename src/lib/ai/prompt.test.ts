import { describe, it, expect } from 'vitest';
import { TASK_BREAKDOWN_PROMPT, buildMessages } from '@/lib/ai/prompt';

describe('TASK_BREAKDOWN_PROMPT', () => {
  it('instructs 3-12 steps', () => {
    expect(TASK_BREAKDOWN_PROMPT).toContain('3 and 12 steps');
  });

  it('requires JSON format', () => {
    expect(TASK_BREAKDOWN_PROMPT).toContain('valid JSON');
  });

  it('specifies timerName and steps fields', () => {
    expect(TASK_BREAKDOWN_PROMPT).toContain('"timerName"');
    expect(TASK_BREAKDOWN_PROMPT).toContain('"steps"');
  });

  it('mentions durationMinutes field', () => {
    expect(TASK_BREAKDOWN_PROMPT).toContain('"durationMinutes"');
  });

  it('specifies duration range in minutes', () => {
    expect(TASK_BREAKDOWN_PROMPT).toContain('minimum 1');
    expect(TASK_BREAKDOWN_PROMPT).toContain('maximum 120');
  });
});

describe('buildMessages', () => {
  it('returns system and user messages', () => {
    const msgs = buildMessages('do laundry');
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
  });

  it('includes the task name in user message', () => {
    const msgs = buildMessages('clean kitchen');
    expect(msgs[1].content).toContain('clean kitchen');
  });

  it('uses the prompt as system message', () => {
    const msgs = buildMessages('test');
    expect(msgs[0].content).toBe(TASK_BREAKDOWN_PROMPT);
  });
});
