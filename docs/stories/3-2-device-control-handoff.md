# Story 3.2: Device Control Handoff

Status: ready-for-dev

## Story

As a **user**,
I want to take control of a running timer from my current device,
so that I can pause, skip, or interact from whichever device I'm near.

## Acceptance Criteria

1. **AC4:** Non-controlling device shows timer in read-only mode with "Take Control" button
2. **AC5:** Tapping "Take Control" makes this device the controller; other device becomes observer
3. **AC6:** Control transfer is seamless — no timer interruption
4. **AC7:** Controller device can use all playback controls (pause, skip, extend, stop)
5. **AC8:** Observer controls are visually disabled or hidden
6. **AC-extra-1:** Observer banner shows "Controlled from another device" text
7. **AC-extra-2:** "Take Control" is a text button, not an icon — clarity over cleverness
8. **AC-extra-3:** No confirmation dialog on Take Control — instant action

## Tasks / Subtasks

- [ ] **Task 1: Create ObserverBanner component** (AC: 4, extra-1, extra-2)
  - [ ] Create `src/components/session/observer-banner.tsx` (`'use client'`)
  - [ ] Props: `{ onTakeControl: () => void }`
  - [ ] Display: "Controlled from another device" + "Take Control" button
  - [ ] Style: subtle banner at top of running timer view, `--info` color accent
  - [ ] Create `src/components/session/observer-banner.test.tsx`

- [ ] **Task 2: Implement controller/observer mode in RunningTimer** (AC: 4, 5, 7, 8)
  - [ ] Compare `session.activeDeviceId` with `useDeviceId()` result
  - [ ] If match → controller mode: full controls, engine writes to Firestore
  - [ ] If mismatch → observer mode: disable controls, show ObserverBanner, engine is passive
  - [ ] Mode switches automatically when `onSnapshot` delivers updated `activeDeviceId`

- [ ] **Task 3: Implement Take Control** (AC: 5, 6, extra-3)
  - [ ] On "Take Control" tap: write `{ activeDeviceId: myDeviceId }` to session doc
  - [ ] `onSnapshot` fires on all devices → mode recalculates
  - [ ] Previous controller seamlessly becomes observer
  - [ ] Timer continues uninterrupted

- [ ] **Task 4: Disable controls in observer mode** (AC: 8)
  - [ ] Update `PlaybackControls` to accept `disabled` prop
  - [ ] When disabled: buttons visually muted, non-interactive
  - [ ] Alternatively: hide controls entirely and show ObserverBanner in their place

- [ ] **Task 5: Write tests** (AC: 4-8)
  - [ ] Test controller mode: controls enabled, no banner
  - [ ] Test observer mode: controls disabled, banner shown
  - [ ] Test Take Control: writes activeDeviceId, mode switches
  - [ ] Verify: `npm run test`

## Dev Notes

### References

- [Source: docs/tech-spec-epic-3.md#Controller-vs-Observer-Mode] — Mode determination and Take Control flow
- [Source: docs/ux-design-specification.md#5.1-Flow-5-Multi-Device-Sync] — Observer mode UX
- [Source: docs/architecture.md#Timer-Engine-State-Machine] — Controller vs observer data flow
- [Source: docs/epics.md#Story-3.2] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
