import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getReadingLevel,
  setReadingLevel,
  STORAGE_KEY_READING_LEVEL,
} from "./reading-level-service";

function stubSyncStore(initial: Record<string, unknown> = {}) {
  const store: Record<string, unknown> = { ...initial };
  const sync = {
    get: vi.fn(async (key: string) => {
      if (key in store) return { [key]: store[key] };
      return {};
    }),
    set: vi.fn(async (obj: Record<string, unknown>) => {
      Object.assign(store, obj);
    }),
  };
  vi.stubGlobal("browser", {
    storage: { sync, local: { get: vi.fn(), set: vi.fn() } },
  });
  return { store, sync };
}

describe("reading-level-service", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'standard' when the level has never been set", async () => {
    stubSyncStore();
    const level = await getReadingLevel();
    expect(level).toBe("standard");
  });

  it("reads the persisted level from chrome.storage.sync", async () => {
    const { sync } = stubSyncStore({ [STORAGE_KEY_READING_LEVEL]: "eli5" });
    const level = await getReadingLevel();
    expect(level).toBe("eli5");
    expect(sync.get).toHaveBeenCalledWith(STORAGE_KEY_READING_LEVEL);
  });

  it("falls back to 'standard' for an unrecognised stored value", async () => {
    stubSyncStore({ [STORAGE_KEY_READING_LEVEL]: "gobbledygook" });
    const level = await getReadingLevel();
    expect(level).toBe("standard");
  });

  it("persists the level via chrome.storage.sync (cross-device), not storage.local", async () => {
    const { store, sync } = stubSyncStore();
    await setReadingLevel("technical");
    expect(sync.set).toHaveBeenCalledWith({
      [STORAGE_KEY_READING_LEVEL]: "technical",
    });
    expect(store[STORAGE_KEY_READING_LEVEL]).toBe("technical");
    expect((browser as any).storage.local.set).not.toHaveBeenCalled();
  });

  it("round-trips a set value back through get", async () => {
    stubSyncStore();
    await setReadingLevel("technical");
    expect(await getReadingLevel()).toBe("technical");
  });
});
