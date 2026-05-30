import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAiCapabilities } from './ai-health-service';

describe('ai-health-service', () => {
  beforeEach(() => {
    vi.stubGlobal('self', {
      ai: {
        languageModel: {
          capabilities: vi.fn(),
        },
      },
    });
  });

  it('should return readily if capabilities available is readily', async () => {
    (self as any).ai.languageModel!.capabilities.mockResolvedValue({ available: 'readily' });
    const result = await checkAiCapabilities();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe('readily');
    }
  });

  it('should return after-download if capabilities available is after-download', async () => {
    (self as any).ai.languageModel!.capabilities.mockResolvedValue({ available: 'after-download' });
    const result = await checkAiCapabilities();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe('after-download');
    }
  });

  it('should return success: true if capabilities available is no', async () => {
    (self as any).ai.languageModel!.capabilities.mockResolvedValue({ available: 'no' });
    const result = await checkAiCapabilities();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe('no');
    }
  });

  it('should return success: false if ai.languageModel is not available', async () => {
    vi.stubGlobal('self', { ai: {} });
    const result = await checkAiCapabilities();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('UNSUPPORTED');
    }
  });
});
