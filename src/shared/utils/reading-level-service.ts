import { ReadingLevel } from "../types/messaging";

/**
 * Persisted reading-level setting.
 *
 * NOTE: this setting is stored in `chrome.storage.sync` (cross-device) by
 * deliberate product choice, so the user's reading level follows them across
 * devices — unlike the theme/enabled toggles which use `storage.local`. Do not
 * switch this to `local` to match the other settings.
 */
export const STORAGE_KEY_READING_LEVEL = "glimpse_reading_level";

export const DEFAULT_READING_LEVEL: ReadingLevel = "standard";

const VALID_LEVELS: readonly ReadingLevel[] = ["eli5", "standard", "technical"];

function isReadingLevel(value: unknown): value is ReadingLevel {
  return (
    typeof value === "string" &&
    (VALID_LEVELS as readonly string[]).includes(value)
  );
}

/**
 * Returns the active reading level from `chrome.storage.sync`, defaulting to
 * `'standard'` when unset or corrupted.
 */
export async function getReadingLevel(): Promise<ReadingLevel> {
  const stored = await browser.storage.sync.get(STORAGE_KEY_READING_LEVEL);
  const value = stored[STORAGE_KEY_READING_LEVEL];
  return isReadingLevel(value) ? value : DEFAULT_READING_LEVEL;
}

/**
 * Persists the reading level to `chrome.storage.sync` (cross-device).
 */
export async function setReadingLevel(level: ReadingLevel): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY_READING_LEVEL]: level });
}
