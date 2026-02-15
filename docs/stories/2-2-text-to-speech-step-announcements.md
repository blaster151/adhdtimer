# Story 2.2: Text-to-Speech Step Announcements

Status: ready-for-dev

## Story

As a **user**,
I want the app to read each step name aloud when it begins,
so that I don't need to look at the screen to know what to do next.

## Acceptance Criteria

1. **AC6:** TTS speaks "[Step Name]. [Duration] minutes." on each step transition
2. **AC7:** TTS works without additional user interaction on the first step (audio unlocked via Play tap)
3. **AC8:** TTS can be disabled via a setting; when disabled, no voice plays
4. **AC9:** If browser does not support Web Speech API or TTS fails, app degrades to visual-only — no error displayed
5. **AC-extra-1:** TTS preference stored in `localStorage` (key: `adhd-timer-tts-enabled`, default: `true`)
6. **AC-extra-2:** TTS toggle accessible from running timer view (small icon button in header)
7. **AC-extra-3:** Chime plays before TTS (50ms gap) — chime alerts attention, TTS delivers content
8. **AC-extra-4:** TTS speaks on first step start as well as transitions

## Tasks / Subtasks

- [ ] **Task 1: Create useTTS hook** (AC: 6, 8, 9, extra-1)
  - [ ] Create `src/hooks/use-tts.ts`
  - [ ] Interface: `{ speak, cancel, isSupported, isEnabled, setEnabled }`
  - [ ] Feature-detect `'speechSynthesis' in window`
  - [ ] `speak(text)`: cancel ongoing, create `SpeechSynthesisUtterance`, rate 1.0, pitch 1.0
  - [ ] `isEnabled` reads from `localStorage` key `adhd-timer-tts-enabled` (default true)
  - [ ] `setEnabled(bool)` writes to `localStorage`
  - [ ] If `!isSupported || !isEnabled`, `speak()` is a no-op
  - [ ] Wrap `speechSynthesis.speak()` in try/catch — never throw
  - [ ] Create `src/hooks/use-tts.test.ts`:
    - Mock `speechSynthesis` — verify `speak` called with correct utterance
    - Test disabled → speak not called
    - Test unsupported browser → no error

- [ ] **Task 2: Integrate TTS with timer engine** (AC: 6, 7, extra-3, extra-4)
  - [ ] In `RunningTimer`, on step transition:
    1. Play chime (from Story 2.1)
    2. Wait ~50ms
    3. `tts.speak("[Step Name]. [Duration] minutes.")`
  - [ ] On timer start (first step): same sequence
  - [ ] **iOS audio unlock:** Call `speechSynthesis.speak()` synchronously inside the Play button handler (user gesture context)

- [ ] **Task 3: Add TTS toggle to running timer** (AC: 8, extra-2, extra-6)
  - [ ] Add a small speaker icon button in the running timer header
  - [ ] Toggle calls `tts.setEnabled(!tts.isEnabled)`
  - [ ] Visual: speaker icon when on, muted speaker when off
  - [ ] `aria-label`: "Text-to-speech enabled" / "Text-to-speech disabled"

- [ ] **Task 4: Write tests** (AC: 6, 7, 8, 9)
  - [ ] `src/hooks/use-tts.test.ts` — comprehensive hook tests
  - [ ] Integration: verify TTS fires on step transition in RunningTimer
  - [ ] Verify all tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **TTS preference in localStorage, not Firestore** (ADR-6): device-specific setting. [Source: docs/architecture.md#ADR-6]
- **Graceful degradation:** Browser APIs fail silently. [Source: docs/architecture.md#Error-Handling-Browser-APIs]
- **iOS Safari audio unlock:** Must call `speechSynthesis.speak()` in direct response to user tap on Play. [Source: docs/tech-spec-epic-2.md#Text-to-Speech-Design]

### References

- [Source: docs/tech-spec-epic-2.md#Text-to-Speech-Design] — useTTS hook interface and implementation
- [Source: docs/architecture.md#Text-to-Speech] — TTS integration point
- [Source: docs/architecture.md#ADR-6] — localStorage for preferences
- [Source: docs/epics.md#Story-2.2] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
