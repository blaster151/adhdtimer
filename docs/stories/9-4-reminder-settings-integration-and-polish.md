# Story 9.4: Reminder Settings Integration & Polish

## Status: backlog

## Story

As a **user**,
I want the reminder and streak settings to work smoothly together and be discoverable,
So that I can customize my experience.

## Background

This is the **final integration and polish story** for Epic 9 (Learning Companion). It focuses on:
1. Organizing all v2 settings (reminders, streaks) in a logical, discoverable structure
2. Ensuring settings work correctly with all v2 playback features (defer, manual advance, checkpoints)
3. End-to-end testing of complex scenarios with all features enabled
4. Fixing edge cases and interaction conflicts

This story is the "shake it until it breaks" pass for all of Epics 6-9.

## Acceptance Criteria

### Settings Organization

**Given** the settings sheet has new v2 toggles
**When** I open settings
**Then:**

1. **AC1:** Settings are organized in logical groups:
   - **Playback:** TTS, Step reminders (with threshold)
   - **Library:** Show streaks
2. **AC2:** Group headers use `<h3>` tags with `--muted` color
3. **AC3:** Each setting has descriptive help text below the toggle
4. **AC4:** Reminder threshold only shows when "Step reminders" is enabled (conditional rendering)
5. **AC5:** All settings are visually aligned and have consistent spacing (16px between items, 24px between groups)
6. **AC6:** Settings sheet doesn't break on narrow screens (320px width)

### Settings Persistence

**Given** I configure all v2 settings
**When** I close the app and reopen it
**Then:**

7. **AC7:** All settings load correctly from localStorage:
   - `adhd-timer-reminder-enabled` (boolean)
   - `adhd-timer-reminder-threshold` (number)
   - `adhd-timer-show-streaks` (boolean)
8. **AC8:** Settings apply immediately on app load (no flash of wrong state)
9. **AC9:** If localStorage is corrupted or missing, defaults are used (reminder: ON/5min, streaks: ON)

### Reminder + Playback Feature Integration

**Given** all v2 playback features are integrated (Active + Wait + Checkpoint + pause-between-steps + defer)
**When** I run a complex timer with all step types
**Then:**

10. **AC10:** Active steps trigger reminders normally (midpoint + overrun)
11. **AC11:** Wait steps do NOT trigger reminders (logic skips Wait steps)
12. **AC12:** Checkpoint steps do NOT trigger reminders (logic skips Checkpoint steps)
13. **AC13:** Deferred steps trigger reminders when eventually run (same logic as normal Active steps)
14. **AC14:** Manual advance (`waiting-for-advance` state) pauses reminder timers
15. **AC15:** On "Start next step" tap, reminder timers resume for the new Active step

### Reminder + Defer Interaction

**Given** I defer an Active step during playback
**When** I eventually run the deferred step
**Then:**

16. **AC16:** Reminder timer starts fresh for the deferred step (not inherited from original position)
17. **AC17:** Midpoint reminder fires at 50% of the deferred step's planned duration
18. **AC18:** Overrun reminders fire every 3 minutes if deferred step exceeds planned duration

### Reminder + Checkpoint Interaction

**Given** a timer has multiple step types: Active → Checkpoint → Active
**When** I run the timer
**Then:**

19. **AC19:** First Active step triggers reminders normally
20. **AC20:** Checkpoint step displays status instantly (no reminder)
21. **AC21:** Second Active step starts fresh reminder timer (not influenced by Checkpoint)

### Reminder + Wait Interaction

**Given** a timer has: Active (10 min) → Wait (5 min) → Active (8 min)
**When** I run the timer with reminders enabled (threshold: 5 min)
**Then:**

22. **AC22:** First Active step triggers midpoint reminder at 5 minutes
23. **AC23:** Wait step does NOT trigger any reminder (skipped)
24. **AC24:** Second Active step triggers midpoint reminder at 4 minutes

### Suggestion + Reminder Interaction

**Given** I complete a timer that triggers both a suggestion and had reminders during playback
**When** the completion view loads
**Then:**

25. **AC25:** Suggestion section displays normally (no conflict with reminder logic)
26. **AC26:** Accepting a suggestion updates step durations (future runs use new durations for reminder midpoint calculations)

### Streak + Reminder Interaction

**Given** I complete a scheduled routine with both streaks and reminders enabled
**When** the session completes
**Then:**

27. **AC27:** Streak updates normally (no conflict with reminder logic)
28. **AC28:** Milestone toast appears on library return (if applicable)
29. **AC29:** Next run of the routine uses updated streak count in badge

### Settings Discoverability

**Given** I am a new user opening settings for the first time
**When** I view the settings sheet
**Then:**

30. **AC30:** All settings have clear labels and help text (no jargon)
31. **AC31:** Grouped layout makes purpose of each setting obvious
32. **AC32:** Default states (ON for reminders/streaks) are user-friendly

### Edge Cases — Settings

33. **AC33:** If I disable reminders mid-session (while timer is running), active reminder timers are cleared immediately
34. **AC34:** If I change reminder threshold mid-session, it does NOT affect the current step (only applies to next step)
35. **AC35:** If I disable streaks but have active streaks, badges hide but tracking continues (streak data persists)

### Edge Cases — Playback

**Given** a complex scenario: timer with all step types, pause-between-steps ON, defer enabled, reminders ON
**When** I run the timer and:
- Defer an Active step
- Complete a Wait step
- Reach a Checkpoint
- Manually advance to next Active step
- Resolve deferred step
**Then:**

36. **AC36:** All features work together without errors or UI glitches
37. **AC37:** Reminder timers correctly start/stop/pause for each transition
38. **AC38:** Deferred step list updates correctly
39. **AC39:** Manual advance prompts appear at correct times
40. **AC40:** Checkpoint displays status without triggering reminders
41. **AC41:** Completion view shows suggestions (if applicable) and streak updates

### Performance & Reliability

42. **AC42:** Settings load from localStorage in <50ms (no perceptible delay)
43. **AC43:** Reminder timers do not leak memory (all timers cleared on unmount)
44. **AC44:** No console errors or warnings during any feature interaction
45. **AC45:** App remains responsive during reminder animations + TTS + Firestore writes

## Technical Notes

### Settings Sheet Organization

```tsx
// src/components/settings/settings-sheet.tsx

<SettingsSheet>
  <SettingsGroup title="Playback">
    <SettingToggle
      label="Text-to-Speech"
      helpText="Announce step transitions and reminders"
      value={ttsEnabled}
      onChange={setTtsEnabled}
    />
    <SettingToggle
      label="Step reminders"
      helpText="Gentle nudges during long steps"
      value={reminderEnabled}
      onChange={setReminderEnabled}
    />
    {reminderEnabled && (
      <SettingStepper
        label="Minimum step duration for reminders"
        options={[
          { label: '3 min', value: 180 },
          { label: '5 min', value: 300 },
          { label: '10 min', value: 600 },
          { label: '15 min', value: 900 },
        ]}
        value={reminderThreshold}
        onChange={setReminderThreshold}
      />
    )}
  </SettingsGroup>

  <SettingsGroup title="Library">
    <SettingToggle
      label="Show streaks"
      helpText="Display streak badges for scheduled routines"
      value={showStreaks}
      onChange={setShowStreaks}
    />
  </SettingsGroup>
</SettingsSheet>
```

### Integration Testing Scenarios

**Scenario 1: Complex Timer with All Features**
- Timer: Active (10 min) → Wait (3 min) → Checkpoint (7:30 target) → Active (5 min)
- Settings: Reminders ON (5 min threshold), Streaks ON, Pause-between-steps ON
- Actions: Start → defer first Active → complete Wait → reach Checkpoint → manually advance → resolve deferred step
- Expected: All features work without conflict

**Scenario 2: Mid-Session Settings Change**
- Start timer with reminders ON
- Disable reminders during step
- Expected: Current reminder timers clear, no new reminders fire

**Scenario 3: Completion with Suggestions + Streak + Milestone**
- Complete scheduled routine (5th run, streak at Day 6 → Day 7)
- Suggestions available (Shower 8 min → 10 min)
- Expected: Completion view shows suggestions, streak updates to Day 7, milestone toast appears on library return

### Cleanup Logic

Ensure all timers are cleared on:
- Step change (clear previous step's timers)
- Session pause (clear/pause all timers)
- Session stop (clear all timers)
- Component unmount (clear all timers)
- Settings change (clear if reminders disabled)

```typescript
// src/hooks/use-reminder.ts
useEffect(() => {
  return () => {
    // Cleanup: clear all timers on unmount
    clearAllReminderTimers();
  };
}, []);

useEffect(() => {
  if (!settings.enabled) {
    clearAllReminderTimers();
  }
}, [settings.enabled]);
```

### Error Handling

- If localStorage read fails → use defaults, log error
- If Firestore write fails (streak update, suggestion accept) → show toast, retry once
- If TTS fails → silent fallback (no blocking error)

### Accessibility

- Settings sheet: keyboard navigable (Tab, Enter, Space)
- All toggles: ARIA labels and roles
- Help text: `aria-describedby` linking to toggle
- Screen reader announces setting changes

## Prerequisites

Story 9.3 (Gentle Step Reminder) must be complete — this story integrates reminder settings.

Story 8.4 (Streak Settings) must be complete — this story verifies streak integration.

Story 9.2 (Suggestion UI) must be complete — this story tests suggestion + reminder interaction.

All prior Epic 6-9 stories must be complete — this is the final integration story.

## Testing Checklist

- [ ] Settings organized in logical groups (Playback, Library)
- [ ] All settings load correctly from localStorage on app restart
- [ ] Reminder threshold only shows when reminders are enabled
- [ ] Settings sheet works at 320px width
- [ ] Active steps trigger reminders, Wait/Checkpoint do not
- [ ] Defer + reminder interaction works correctly
- [ ] Manual advance pauses reminder timers
- [ ] Checkpoint skips reminder logic
- [ ] Disabling reminders mid-session clears timers
- [ ] Suggestion + reminder + streak all work together
- [ ] Complex scenario (all step types + all features) works without errors
- [ ] No memory leaks (timers cleared on unmount)
- [ ] No console errors during any feature interaction
- [ ] Accessibility: keyboard navigation, screen reader support

## Definition of Done

- [ ] All ACs pass
- [ ] Settings sheet refactored with organized groups
- [ ] All integration scenarios tested and passing
- [ ] Edge cases handled and tested
- [ ] End-to-end test: complex timer with all features → verify all interactions
- [ ] Memory leak test: run timer, unmount component, verify timers cleared
- [ ] Performance test: settings load <50ms, no jank during animations
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Merged to main branch
- [ ] **Epic 9 (Learning Companion) complete** 🎉
