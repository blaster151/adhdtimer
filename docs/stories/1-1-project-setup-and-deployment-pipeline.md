# Story 1.1: Project Setup & Deployment Pipeline

Status: ready-for-dev

## Story

As a **developer**,
I want a fully configured Next.js 16 project with CI/CD deployment to GCP Cloud Run,
so that every subsequent story can be built, tested, and deployed incrementally.

## Acceptance Criteria

1. **AC1:** Next.js 16.1.x project initialized with TypeScript, Tailwind CSS 4, App Router, `src/` directory, ESLint, and `@/*` import alias
2. **AC2:** Prettier 3.x installed and configured (`.prettierrc`)
3. **AC3:** Firebase client SDK (`firebase@^12.9`) installed
4. **AC4:** shadcn/ui initialized with Deep Forest 🌲 theme tokens in `src/styles/globals.css`
5. **AC5:** shadcn/ui components installed: `button`, `input`, `label`, `dialog`, `toast`, `card`, `switch`, `sheet`, `skeleton`, `dropdown-menu`, `separator`, `form`
6. **AC6:** `@ducanh2912/next-pwa` installed and configured with basic `manifest.json` and PWA icons
7. **AC7:** `.env.example` committed with all required environment variable keys (no values)
8. **AC8:** `.env.local` configured locally with Firebase project credentials (gitignored)
9. **AC9:** `Dockerfile` for multi-stage Next.js standalone production build
10. **AC10:** `cloudbuild.yaml` for Cloud Build → Cloud Run deployment pipeline
11. **AC11:** `.dockerignore` excludes `node_modules`, `.next`, `docs`, `bmad`
12. **AC12:** Project deploys to GCP Cloud Run on push to `master` via Cloud Build trigger
13. **AC13:** Folder structure established: `src/app/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/styles/`
14. **AC14:** A "Hello World" landing page renders at `/` (server component)
15. **AC15:** `npm run dev` starts the development server successfully via Turbopack
16. **AC16:** `npm run build` completes without errors
17. **AC17:** Vitest installed and configured with a passing smoke test

## Tasks / Subtasks

- [ ] **Task 1: Initialize Next.js project** (AC: 1, 13, 15)
  - [ ] Run `npx create-next-app@latest adhdtimer --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"`
  - [ ] Verify folder structure: `src/app/`, `src/styles/globals.css`
  - [ ] Verify `npm run dev` starts successfully

- [ ] **Task 2: Install and configure Prettier** (AC: 2)
  - [ ] `npm install -D prettier eslint-config-prettier`
  - [ ] Create `.prettierrc` with project settings (semi: true, singleQuote: true, tabWidth: 2, trailingComma: 'all')
  - [ ] Add `prettier` to ESLint extends

- [ ] **Task 3: Install Firebase SDK** (AC: 3)
  - [ ] `npm install firebase@^12.9`
  - [ ] Create `src/lib/firebase/config.ts` with Firebase initialization (reads from env vars)
  - [ ] Note: Do NOT install `firebase-admin` — deferred to Epic 5 if needed per ADR-2

- [ ] **Task 4: Set up shadcn/ui with Deep Forest theme** (AC: 4, 5)
  - [ ] `npx shadcn@latest init` (select: New York style, CSS variables: yes)
  - [ ] Update `src/styles/globals.css` with Deep Forest CSS custom properties:
    - `--background: #0C0F0A`, `--surface: #151A13`, `--elevated: #1E261B`, `--border: #2A3326`
    - `--primary: #7EBD73`, `--primary-soft: #A8C9A0`, `--accent-warm: #D4A96A`
    - `--text: #E8DCC8`, `--muted: #8A8474`
    - `--ahead: #6BB5A0`, `--on-track: #7EBD73`, `--behind: #D4A96A`, `--warning: #C47A6C`, `--info: #6B94B8`
  - [ ] Update `tailwind.config.ts` to extend colors with Deep Forest tokens
  - [ ] Install shadcn components: `npx shadcn@latest add button input label dialog toast card switch sheet skeleton dropdown-menu separator form`

- [ ] **Task 5: Set up PWA** (AC: 6)
  - [ ] `npm install @ducanh2912/next-pwa`
  - [ ] Configure in `next.config.ts` (wrap config with `withPWA`)
  - [ ] Create `public/manifest.json` with app name, theme color (#0C0F0A), icons
  - [ ] Add PWA icon placeholders at `public/icons/icon-192.png` and `public/icons/icon-512.png`

- [ ] **Task 6: Environment variables** (AC: 7, 8)
  - [ ] Create `.env.example`:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=
    OPENAI_API_KEY=
    ANTHROPIC_API_KEY=
    ```
  - [ ] Create `.env.local` with actual Firebase project values (gitignored)
  - [ ] Verify `.gitignore` includes `.env.local`

- [ ] **Task 7: Docker + Cloud Build setup** (AC: 9, 10, 11)
  - [ ] Create `Dockerfile`:
    - Stage 1: `node:20-alpine` — install deps
    - Stage 2: build with `next build` (standalone output)
    - Stage 3: `node:20-alpine` — copy standalone output, expose port 8080, `CMD ["node", "server.js"]`
  - [ ] Configure `next.config.ts`: `output: 'standalone'`
  - [ ] Create `.dockerignore`: `node_modules`, `.next`, `docs`, `bmad`, `.git`, `.env.local`
  - [ ] Create `cloudbuild.yaml`:
    ```yaml
    steps:
      - name: 'gcr.io/cloud-builders/docker'
        args: ['build', '-t', 'gcr.io/$PROJECT_ID/adhdtimer', '.']
      - name: 'gcr.io/cloud-builders/docker'
        args: ['push', 'gcr.io/$PROJECT_ID/adhdtimer']
      - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
        args: ['gcloud', 'run', 'deploy', 'adhdtimer',
               '--image', 'gcr.io/$PROJECT_ID/adhdtimer',
               '--region', 'us-central1',
               '--platform', 'managed',
               '--allow-unauthenticated',
               '--port', '8080']
    ```

- [ ] **Task 8: GCP Cloud Build trigger** (AC: 12)
  - [ ] Create Cloud Build trigger in GCP Console linking to `blaster151/adhdtimer` GitHub repo
  - [ ] Trigger on push to `master` branch
  - [ ] Set environment variables / substitutions for Firebase config
  - [ ] Verify first deploy succeeds

- [ ] **Task 9: Create folder structure and landing page** (AC: 13, 14)
  - [ ] Create empty directories: `src/components/auth/`, `src/components/timer/`, `src/components/session/`, `src/components/layout/`, `src/components/ui/`, `src/hooks/`, `src/lib/firebase/`, `src/lib/ai/`, `src/lib/utils/`, `src/types/`
  - [ ] Create `src/lib/utils/cn.ts` (Tailwind class merge utility — comes with shadcn)
  - [ ] Update `src/app/page.tsx` to render a simple landing page: "ADHD Timer" heading with Deep Forest theme applied
  - [ ] Update `src/app/layout.tsx` with Inter font, Deep Forest background, metadata

- [ ] **Task 10: Set up Vitest** (AC: 17)
  - [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - [ ] Create `vitest.config.ts` with jsdom environment, path aliases
  - [ ] Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json` scripts
  - [ ] Create `src/lib/utils/cn.test.ts` as a smoke test
  - [ ] Verify `npm run test` passes

- [ ] **Task 11: Verify build** (AC: 16)
  - [ ] Run `npm run build` and confirm no errors
  - [ ] Verify standalone output exists in `.next/standalone/`

## Dev Notes

### Architecture Patterns & Constraints

- **Client components:** All app pages under `src/app/app/` will use `'use client'` directive (future stories). Landing page at `src/app/page.tsx` is a server component.
- **No barrel exports:** Import directly from file paths, not via `index.ts` files. [Source: docs/architecture.md#Code-Organization]
- **Naming conventions:** kebab-case files, PascalCase components, camelCase Firestore fields. [Source: docs/architecture.md#Naming-Conventions]
- **Error handling:** `{ data, error }` tuple pattern for all Firestore operations. [Source: docs/architecture.md#Error-Handling]
- **Next.js standalone output:** Required for Cloud Run containerization — `output: 'standalone'` in `next.config.ts`

### Deep Forest Theme Tokens

All color values from the locked-in UX design specification:

| Token | Hex | CSS Variable |
|-------|-----|-------------|
| Background | #0C0F0A | `--background` |
| Surface | #151A13 | `--surface` |
| Elevated | #1E261B | `--elevated` |
| Border | #2A3326 | `--border` |
| Primary | #7EBD73 | `--primary` |
| Primary Soft | #A8C9A0 | `--primary-soft` |
| Accent Warm | #D4A96A | `--accent-warm` |
| Text | #E8DCC8 | `--text` |
| Muted | #8A8474 | `--muted` |
| Ahead | #6BB5A0 | `--ahead` |
| On Track | #7EBD73 | `--on-track` |
| Behind | #D4A96A | `--behind` |
| Warning | #C47A6C | `--warning` |
| Info | #6B94B8 | `--info` |

[Source: docs/ux-design-specification.md#3.1-Color-System]

### Project Structure Notes

This story establishes the directory skeleton used by all subsequent stories:

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (this story)
│   ├── page.tsx            # Landing page (this story)
│   ├── login/              # (Story 1.2)
│   ├── app/                # (Story 1.2+)
│   └── api/                # (Story 5.1)
├── components/
│   ├── ui/                 # shadcn/ui (this story)
│   ├── auth/               # (Story 1.2)
│   ├── timer/              # (Story 1.4+)
│   ├── session/            # (Story 1.6+)
│   └── layout/             # (future)
├── hooks/                  # (Story 1.6+)
├── lib/
│   ├── firebase/
│   │   └── config.ts       # Firebase init (this story)
│   ├── ai/                 # (Story 5.1)
│   └── utils/
│       └── cn.ts           # Class merge (this story)
├── types/                  # (Story 1.3)
└── styles/
    └── globals.css          # Deep Forest tokens (this story)
```

[Source: docs/architecture.md#Project-Structure]

### References

- [Source: docs/architecture.md#Project-Initialization] — `create-next-app` command and dependency install
- [Source: docs/architecture.md#Decision-Summary] — All technology decisions with versions
- [Source: docs/architecture.md#Deployment-Architecture] — GCP Cloud Run setup
- [Source: docs/architecture.md#ADR-1b] — GCP Cloud Run over Vercel rationale
- [Source: docs/ux-design-specification.md#3.1-Color-System] — Deep Forest color tokens
- [Source: docs/ux-design-specification.md#9.4-Tailwind-Theme-Extension] — Tailwind config colors
- [Source: docs/ux-design-specification.md#3.2-Typography] — Inter font family
- [Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations] — Full dependency list
- [Source: docs/implementation-readiness-report-2026-02-14.md] — Gate check H1/H2/H3 refinements applied

## Review Notes

**Approved:** 2026-02-14 by BMad Master (🧙)

**Review Checklist:**
- ✅ All 17 ACs traceable to architecture and tech spec
- ✅ Deep Forest theme tokens match UX design specification exactly
- ✅ Next.js 16.1.x version pinned per gate check H1
- ✅ No firebase-admin per ADR-2 / gate check H2
- ✅ PWA included per gate check H3
- ✅ GCP Cloud Run deployment per ADR-1b
- ✅ Vitest testing framework included
- ✅ Folder structure matches architecture.md exactly
- ✅ All 11 tasks have clear subtasks and AC mappings
- ✅ No scope creep — limited to project scaffolding only

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
