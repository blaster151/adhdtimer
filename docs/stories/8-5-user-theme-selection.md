# Story 8.5: User Theme Selection

## Status: backlog

## Story

As a **user**,
I want to choose from a curated set of color themes and have my choice persist across all my devices,
So that my timer experience feels personally mine and visually comfortable.

## Background

The app currently ships with the **Deep Forest 🌲** theme hardcoded in `globals.css`. The UX design phase explored 4 themes (`docs/ux-color-themes.html`), and we're adding a 5th (Twilight Lavender) for a total of **5 options** spanning different moods across the color wheel:

| # | Theme | Emoji | Mood | Primary |
|---|-------|-------|------|---------|
| 1 | **Deep Forest** | 🌲 | Earthy, grounding, mossy | `#7EBD73` moss green |
| 2 | **Warm Dusk** | 🌅 | Sunset warmth, amber glow | `#E8A44E` golden amber |
| 3 | **Night Ocean** | 🌊 | Deep sea calm, bioluminescent | `#56C4B5` teal |
| 4 | **Soft Clay** | 🏺 | Terracotta, handmade warmth | `#CC7B5C` burnt sienna |
| 5 | **Twilight Lavender** | 🌙 | Cool dusk, gentle violet calm | `#A78BDB` soft purple |

**Deep Forest** remains the default — it was the design-phase winner. Theme preference persists in Firestore on the user's profile doc so it follows them across devices.

## Acceptance Criteria

### Theme Definition & CSS Architecture

**Given** `src/lib/themes/` directory
**When** `themes.ts` is created
**Then:**

1. **AC1:** A `ThemeId` union type is defined: `'deep-forest' | 'warm-dusk' | 'night-ocean' | 'soft-clay' | 'twilight-lavender'`
2. **AC2:** A `ThemeDefinition` interface contains: `id: ThemeId`, `name: string`, `emoji: string`, `description: string`, and a `colors` object with all CSS custom property values (background, surface, elevated, border, primary, primary-soft, accent-warm, foreground, muted, ahead, on-track, behind, warning, info, wait, checkpoint, deferred, ring-glow, and all shadcn semantic tokens)
3. **AC3:** `THEMES` is a `Record<ThemeId, ThemeDefinition>` containing all 5 fully-defined themes
4. **AC4:** `DEFAULT_THEME: ThemeId = 'deep-forest'`
5. **AC5:** Each theme's colors pass WCAG AA contrast for text-on-background and primary-on-primary-foreground

### Theme Color Palettes

**Given** the 5 theme definitions
**When** reviewing each palette
**Then:**

6. **AC6:** **Deep Forest 🌲** — existing production values (no changes): background `#0C0F0A`, primary `#7EBD73`, text `#E8DCC8`
7. **AC7:** **Warm Dusk 🌅** — warm browns + amber: background `#110E0B`, primary `#E8A44E`, text `#F0E6D6`
8. **AC8:** **Night Ocean 🌊** — deep blues + teal: background `#090D11`, primary `#56C4B5`, text `#DEE8EC`
9. **AC9:** **Soft Clay 🏺** — warm neutrals + terracotta: background `#0F0C0A`, primary `#CC7B5C`, text `#ECE0D4`
10. **AC10:** **Twilight Lavender 🌙** — cool dark-purples + soft violet: background `#0D0B11`, surface `#15121A`, elevated `#1E1A26`, border `#2A2533`, primary `#A78BDB`, primary-soft `#BFA8E0`, accent-warm `#D4A96A`, text `#E4DEF0`, muted `#7E7A8A`

### Applying Themes (CSS Custom Properties)

**Given** a user has selected a theme
**When** the app loads or the theme changes
**Then:**

11. **AC11:** All CSS custom properties in `:root` are updated to match the selected theme's colors
12. **AC12:** Theme application uses `document.documentElement.style.setProperty()` for each custom property
13. **AC13:** A `useTheme()` hook provides: `currentTheme: ThemeId`, `setTheme(id: ThemeId)`, `themes: ThemeDefinition[]`
14. **AC14:** Theme change takes effect immediately — no page reload required
15. **AC15:** Theme is applied on initial page load before first paint (no flash of default theme)
16. **AC16:** The existing `globals.css` `:root` block retains Deep Forest values as the CSS fallback

### Persistence — Firestore (Cross-Device)

**Given** a signed-in user selects a theme
**When** the selection is saved
**Then:**

17. **AC17:** Theme preference is stored in Firestore at `users/{userId}` document with field `themeId: ThemeId`
18. **AC18:** On app load, `useTheme()` reads the user's Firestore doc and applies their saved theme
19. **AC19:** On theme change, Firestore doc is updated (debounced if rapidly switching in theme picker)
20. **AC20:** If no `themeId` field exists (new user or pre-feature user), Deep Forest is used as default
21. **AC21:** Firestore security rules allow authenticated users to read/write their own `users/{userId}` doc

### Theme Picker UI

**Given** the settings sheet (or a new "Appearance" section)
**When** I view the theme picker
**Then:**

22. **AC22:** A "Theme" section appears in settings with 5 theme options
23. **AC23:** Each option shows: emoji, theme name, and a row of 4 color swatches (background, primary, accent, text)
24. **AC24:** The currently active theme has a visible selected state (border highlight or checkmark)
25. **AC25:** Tapping a theme applies it instantly (live preview before explicit save — the tap IS the save)
26. **AC26:** Theme picker is accessible: `role="radiogroup"` with `role="radio"` items, keyboard navigable
27. **AC27:** ARIA: selecting a theme announces "[Theme Name] theme applied"

### Edge Cases

28. **AC28:** If Firestore read fails (offline), falls back to localStorage cache, then to Deep Forest
29. **AC29:** localStorage caches the last-known theme as `adhd-timer-theme` for fast initial paint
30. **AC30:** If an invalid/unknown `themeId` is found in Firestore, Deep Forest is used

## Technical Notes

### New Files
- `src/lib/themes/themes.ts` — ThemeId, ThemeDefinition, THEMES constant, DEFAULT_THEME
- `src/lib/themes/apply-theme.ts` — `applyTheme(theme: ThemeDefinition)` function that sets CSS custom properties
- `src/hooks/use-theme.ts` — hook: reads Firestore + localStorage, provides currentTheme + setTheme
- `src/components/settings/theme-picker.tsx` — radiogroup UI with swatch previews
- `src/lib/firebase/user-preferences.ts` — `getUserPreferences(userId)`, `updateUserPreferences(userId, prefs)`

### Modified Files
- `src/components/layout/settings-sheet.tsx` — integrate ThemePicker component
- `src/app/layout.tsx` — apply theme on mount (blocking script or useLayoutEffect)
- `firestore.rules` — add `users/{userId}` read/write rules for authenticated owner
- `src/app/globals.css` — no changes (Deep Forest stays as CSS fallback)

### Loading Strategy (No Flash)
1. On page load, read `localStorage('adhd-timer-theme')` synchronously
2. Apply theme CSS vars via inline `<script>` in `layout.tsx` (or `useLayoutEffect`) before paint
3. In background, fetch Firestore doc — if different from localStorage, update both and re-apply
4. This means: localStorage = fast paint, Firestore = source of truth, graceful reconciliation

### Twilight Lavender 🌙 — Full Palette
```
Background:     #0D0B11
Surface:        #15121A
Elevated:       #1E1A26
Border:         #2A2533
Primary:        #A78BDB
Primary Soft:   #BFA8E0
Accent Warm:    #D4A96A  (shared warm accent across all themes)
Text:           #E4DEF0
Muted:          #7E7A8A
Ahead:          #6BB5A0  (shared)
On Track:       #A78BDB
Behind:         #D4A96A  (shared)
Warning:        #C47A6C  (shared)
Info:           #7A8ED4
Wait:           #7A8ED4
Checkpoint:     #C9A84C  (shared)
Deferred:       #7E7A8A
Ring Glow:      rgba(167, 139, 219, 0.35)
```

### Firestore Data Model
```typescript
// Collection: users/{userId}
interface UserPreferences {
  themeId?: ThemeId;        // 'deep-forest' | 'warm-dusk' | ...
  // Future: other cross-device preferences
}
```

### Test Coverage
- `themes.test.ts` — all 5 themes define all required color keys, DEFAULT_THEME is valid
- `apply-theme.test.ts` — applies correct CSS vars, handles missing properties
- `use-theme.test.ts` — reads Firestore, falls back to localStorage, falls back to default, writes on change
- `theme-picker.test.tsx` — renders all 5 themes, selection updates, accessibility (radiogroup + keyboard)
- `user-preferences.test.ts` — Firestore read/write, handles missing doc

## Prerequisites
- Story 8.4 (or can be parallelized after 8.1 since it's independent of schedule/streak work)

## Estimation
- **Points:** 5 (moderate — theme definitions + CSS plumbing + Firestore persistence + UI)
