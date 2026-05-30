---
baseline_commit: 7bfe92bb5a194b7d2e17c781c0197f0e69856e74
---
# Story 2.4: Streaming Tactical Popover UI

Status: review

## Story

As a learner,
I want to see the AI response as it is generated,
so that I feel the interaction is immediate and fluid.

## Acceptance Criteria

1. **Given** the AI bridge is active
2. **When** tokens are received from the Service Worker
3. **Then** the Popover UI must render the text in real-time using `Source Serif Pro`.
4. **And** it must automatically adjust its theme colors based on the host page's CSS variables.
5. **And** it must include a "Deep Chat" button to transition to the Side Panel.
6. **And** screen readers must announce "Glimpse synthesis in progress."

## Tasks / Subtasks

- [x] **Enhance Popover UI Styling & Typography** (AC: 3, 4)
  - [x] Implement `Source Serif Pro` for main content in `TacticalPopover.tsx`.
  - [x] Ensure `Lunar Palette` CSS variables are correctly applied for `surface-overlay`, `ink-primary`, etc.
  - [x] Implement theme sniffing/adaptation logic (ensure variables like `--color-accent` from host page can be inherited or mapped).
- [x] **Implement Streaming Display Logic** (AC: 1, 2, 3)
  - [x] Update `TacticalPopover.tsx` to handle `streamingText` and `isStreaming` props effectively.
  - [x] Ensure no layout flickering during text updates (use stable containers).
- [x] **Accessibility (A11y)** (AC: 6)
  - [x] Add `aria-live="polite"` or `aria-busy` to the streaming container.
  - [x] Ensure "Glimpse synthesis in progress" is announced correctly.
- [x] **Transition to Side Panel ("Bloom")** (AC: 5)
  - [x] Add "Deep Chat" button to `TacticalPopover.tsx`.
  - [x] Implement click handler to open the side panel (using `browser.sidePanel.open` or a message to background).
  - [x] (Optional/Prep) Define message to pass current context to Side Panel.
- [x] **Verification & Testing**
  - [x] Verify real-time rendering with mock stream.
  - [x] Verify theme adaptation on different mock host pages.
  - [x] Test "Deep Chat" button functionality.

### Review Findings

- [x] [Review][Decision] Storage Race Condition / Context Bridge — Using a single global key `active_research_context` is fragile with multiple tabs; one tab can overwrite another. Should use `tabId` or a different bridge.
- [x] [Review][Patch] Selection Loss on Deep Chat Click [src/entrypoints/content.tsx:15]
- [x] [Review][Patch] Unsupported API Crash (sidePanel) [src/entrypoints/background.ts:70]
- [x] [Review][Patch] Limited Theme Sniffer Scope [src/hooks/use-theme-sniffer.ts:13]
- [x] [Review][Patch] Conditional/Redundant SR Announcement [src/components/overlays/TacticalPopover.tsx:77]
- [x] [Review][Patch] Accessibility: Small Button Font Size [src/assets/main.css:135]
- [x] [Review][Patch] CSS: Clipping Hazards [src/assets/main.css:115]
- [x] [Review][Patch] Native Popover API Alignment [src/components/overlays/TacticalPopover.tsx:48]
- [x] [Review][Patch] Incomplete Design Tokens [src/assets/main.css:1]

## Dev Notes

- **Typography:** Use `Source Serif Pro` (configured in `main.css` as `--font-serif`).
- **Isolation:** The UI is already isolated via Shadow DOM (managed in `content.tsx` via `createShadowRootUi`).
- **Streaming:** `useAiStream` hook already provides `streamingText` and `isStreaming`. Ensure `TacticalPopover` consumes these correctly.
- **Theme Sniffing:** WXT's `createShadowRootUi` with `cssInjectionMode: 'ui'` should allow CSS variables from the host page to be visible if not explicitly blocked.
- **Side Panel:** Use `browser.sidePanel.open({ windowId: ... })` to trigger the side panel from the content script (may require background proxying depending on permissions).

### Project Structure Notes

- **Shared Styles:** `src/assets/main.css` contains the Lunar Palette. Ensure these are injected into the Shadow Root.
- **Components:** `src/components/overlays/TacticalPopover.tsx` is the primary file to update.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Architecture]
- [Previous Story: _bmad-output/implementation-artifacts/2-3-port-based-ai-bridge-background-worker.md]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (CLI)

### Debug Log References

### Completion Notes List
- Implemented Source Serif Pro and Inter typography.
- Applied Lunar Palette with Platinum Gold top accent.
- Implemented `useThemeSniffer` hook to adapt to host page CSS variables.
- Updated `TacticalPopover` to support real-time streaming tokens and stable layout.
- Added "Deep Chat" button with footer and styling.
- Implemented messaging to background to open side panel via `OPEN_SIDE_PANEL`.
- Preserved research context in `chrome.storage.local` before transition.
- Added accessibility improvements: `aria-busy`, `aria-live`, and `sr-only` announcements.
- Verified with unit tests for `useThemeSniffer`.

### File List
- src/assets/main.css
- src/components/overlays/TacticalPopover.tsx
- src/entrypoints/content.tsx
- src/hooks/use-theme-sniffer.ts
- src/hooks/use-theme-sniffer.test.ts
- src/shared/types/messaging.ts
- src/entrypoints/background.ts
