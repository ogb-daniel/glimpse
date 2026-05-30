## Deferred from: code review of 1-3-hardware-validation-welcome-tab.md (2026-05-30)\n- Identity Failure Caching [src/shared/utils/identity-service.ts]: If identity generation fails, the promise is cached indefinitely, preventing retries. (Pre-existing)
\n## Deferred from: code review of 2-1-magic-hold-detector-animation.md (2026-05-30)\n- Multi-line selection "ghost zones" [src/hooks/use-magic-hold.ts]: getBoundingClientRect creates a large rectangle covering white space between lines.\n- Feature scope: Missing form field and touch support [src/hooks/use-magic-hold.ts]: Touch events and input/textarea selections not currently supported.
## Deferred from: code review of 2-2-shadow-dom-popover-framework.md (2026-05-30)

- Touch device support missing: The current 'hold' detection logic relies on mouse events and does not account for touchstart/touchend interactions.
- Shadow DOM/iframe-heavy site support: Global listeners may fail to capture events within nested Shadow Roots or cross-origin iframes.

## Deferred from: code review (2026-05-30) of 2-5-pdf-support.md
- PDF Detection spoofing [src/shared/utils/pdf-utils.ts:16] - Relies on spoofable headers/URLs; might trigger on non-PDF pages.

## Deferred from: code review of 3-1-dexie-js-schema-auto-save.md (2026-05-30)
- Improve database testing strategy (remove monkey-patching and hardcoded imports) [src/hooks/use-scrapbook.test.ts]
- Strict Domain Modeling (separate DTO without id vs Entity with id) [src/shared/types/models.ts]
