import { describe, it, expect, vi, beforeEach } from "vitest";
import { STORAGE_KEY_READING_LEVEL } from "../shared/utils/reading-level-service";

/**
 * End-to-end wiring test for the background service worker: on START_AI_STREAM
 * it must read the reading level from chrome.storage.sync and build the prompt
 * for that level, then drive the on-device LanguageModel path (no network).
 */

type Listener = (...args: any[]) => any;

function setup(syncStore: Record<string, unknown>) {
  // Capture the port-connect handler the background registers.
  let connectHandler: Listener | undefined;

  const promptStreaming = vi.fn(() => ({
    getReader: () => ({
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: "ok" })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    }),
  }));

  const create = vi.fn(async () => ({
    promptStreaming,
    destroy: vi.fn(),
  }));

  vi.stubGlobal("LanguageModel", {
    availability: vi.fn(async () => "available"),
    create,
  });

  vi.stubGlobal("defineBackground", (cb: () => void) => {
    cb();
    return cb;
  });

  vi.stubGlobal("browser", {
    runtime: {
      id: "test-extension",
      onConnect: { addListener: (fn: Listener) => (connectHandler = fn) },
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
      getURL: (p: string) => p,
    },
    tabs: { create: vi.fn() },
    storage: {
      sync: {
        get: vi.fn(async (key: string) =>
          key in syncStore ? { [key]: syncStore[key] } : {},
        ),
        set: vi.fn(),
      },
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(),
      },
    },
  });

  return {
    getConnectHandler: () => connectHandler,
    promptStreaming,
    create,
  };
}

async function sendStartStream(getConnectHandler: () => Listener | undefined) {
  let messageHandler: Listener | undefined;
  const port = {
    name: "ai-bridge",
    postMessage: vi.fn(),
    onMessage: { addListener: (fn: Listener) => (messageHandler = fn) },
  };
  getConnectHandler()!(port);
  await messageHandler!({
    type: "START_AI_STREAM",
    payload: {
      contextText: "Closure",
      metadata: { url: "https://example.com", title: "JS Guide" },
    },
  });
  return port;
}

describe("background START_AI_STREAM reading-level wiring", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("builds the eli5 prompt when storage.sync holds eli5", async () => {
    const h = setup({ [STORAGE_KEY_READING_LEVEL]: "eli5" });
    await import("./background");
    await sendStartStream(h.getConnectHandler);

    expect(h.promptStreaming).toHaveBeenCalledTimes(1);
    const prompt = h.promptStreaming.mock.calls[0][0] as string;
    expect(prompt.toLowerCase()).toContain("analogy");
    expect(prompt).not.toContain("dictionary definition of the word itself");
  });

  it("builds the standard prompt when storage.sync is unset", async () => {
    const h = setup({});
    await import("./background");
    await sendStartStream(h.getConnectHandler);

    const prompt = h.promptStreaming.mock.calls[0][0] as string;
    expect(prompt).toContain("dictionary definition of the word itself");
    expect(prompt.toLowerCase()).not.toContain("analogy");
  });

  it("uses the on-device LanguageModel and introduces no fetch/network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const h = setup({ [STORAGE_KEY_READING_LEVEL]: "technical" });
    await import("./background");
    await sendStartStream(h.getConnectHandler);

    expect(h.create).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
