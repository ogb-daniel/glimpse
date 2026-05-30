---
baseline_commit: 0d99d04ef1369ec25de4a280e89bc1129ccb4d33
---
# Story 3.1: Dexie.js Schema & Auto-Save

Status: review

## Story

As a developer,
I want a robust local database,
so that user research is never lost and is easily queryable for UI features.

## Acceptance Criteria

1. **Given** the extension is active
2. **When** the database initializes
3. **Then** it must use Dexie.js (v4.4.3) with a schema for `userScrapbook` (including `term`, `explanation`, `domainUrl`, `learnedAt`).
4. **And** every successful AI interaction must be automatically saved to the database.
5. **And** all property names must follow `camelCase` conventions.

## Tasks / Subtasks

- [x] Initialize Dexie.js (AC: #3, #5)
  - [x] Add `dexie@^4.4.3` to dependencies
  - [x] Create `src/shared/db/dexie-db.ts` defining the `GlimpseDatabase` class and `userScrapbook` store
- [x] Establish Data Models (AC: #5)
  - [x] Create `src/shared/types/models.ts` for database record interfaces
- [x] Implement Auto-Save logic (AC: #4)
  - [x] Create `src/hooks/use-scrapbook.ts` with `saveInteraction` method using the Result pattern
  - [x] Integrate `saveInteraction` into the AI completion flow (likely in `use-ai-stream.ts` or the component handling the stream end)
- [x] Verify Data Integrity (AC: #4, #5)
  - [x] Add `src/shared/db/dexie-db.test.ts` to verify schema and CRUD operations
  - [x] Add `src/hooks/use-scrapbook.test.ts` to verify the auto-save integration logic

### Review Follow-ups (AI)

- [x] [Review][Patch] Move `fake-indexeddb` from `dependencies` to `devDependencies` [package.json]
- [x] [Review][Patch] Fix Result Pattern error handling in `use-ai-stream.ts`; handle `success: false` properly instead of using `.catch()` [src/hooks/use-ai-stream.ts:51]
- [x] [Review][Patch] Add guards against saving interactions with empty `contextText`, empty `fullText`, or missing `metadata.url` [src/hooks/use-ai-stream.ts:48]
- [x] [Review][Patch] Remove unnecessary type cast `entry as UserScrapbook` [src/hooks/use-scrapbook.ts:18]
- [x] [Review][Defer] Improve database testing strategy (remove monkey-patching and hardcoded imports) [src/hooks/use-scrapbook.test.ts] — deferred, pre-existing
- [x] [Review][Defer] Strict Domain Modeling (separate DTO without `id` vs Entity with `id`) [src/shared/types/models.ts] — deferred, pre-existing

## Dev Notes

- **IndexedDB (Dexie.js):** Version 4.4.3 is mandated by architecture.
- **Schema Definition:** `userScrapbook: '++id, term, domainUrl, learnedAt'`. The `explanation` field should be included in the object but doesn't necessarily need to be indexed unless full-text search is required later.
- **Naming:** Strictly follow `camelCase` for all store names (`userScrapbook`) and properties (`domainUrl`, `learnedAt`).
- **Result Pattern:** All database operations must return a discriminated union:
  ```typescript
  type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string };
  ```
- **Concurrency:** Ensure that multiple "Magic Holds" in different tabs don't cause DB collisions (Dexie handles most of this, but be mindful of transaction scopes).

### Project Structure Notes

- **Shared Database:** `src/shared/db/dexie-db.ts` acts as the single source of truth for the database instance.
- **Hook Layer:** `src/hooks/use-scrapbook.ts` provides a clean React interface for UI components.
- **Types:** `src/shared/types/models.ts` should be referenced by both the database and hooks.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/prds/prd-plain-20260529/prd.md#FR-3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-001

### Debug Log References
- Encountered missing DOM globals for Dexie in Vitest. Fixed by specifying `jsdom` environment and moving `fake-indexeddb` polyfill before dexie initialization.
- Added type annotations for DbResult to pass rigorous typescript linting.

### Completion Notes List
- Initialized Dexie.js v4.4.3 dependency.
- Defined `GlimpseDatabase` class and strict TypeScript schema (`models.ts`).
- Created `useScrapbook` hook with robust error handling via Discriminated Union pattern.
- Integrated `saveInteraction` dynamically on `AI_STREAM_COMPLETE` in `use-ai-stream.ts`.
- Validated via comprehensive unit testing with mock IndexedDB instances in JSDOM.

### File List
- `package.json`
- `package-lock.json`
- `src/shared/types/models.ts`
- `src/shared/db/dexie-db.ts`
- `src/shared/db/dexie-db.test.ts`
- `src/hooks/use-scrapbook.ts`
- `src/hooks/use-scrapbook.test.ts`
- `src/hooks/use-ai-stream.ts`
- `_bmad-output/implementation-artifacts/3-1-dexie-js-schema-auto-save.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
