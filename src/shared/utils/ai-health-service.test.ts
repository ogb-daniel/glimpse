import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAiCapabilities } from './ai-health-service';

describe('ai-health-service', () => {
  beforeEach(() => {
    vi.stubGlobal('ai', {
      languageModel: {
        capabilities: vi.fn(),
      },
    });
  });

  it('should return readily if capabilities available is readily', async () => {
    (ai.languageModel.capabilities as any).mockResolvedValue({ available: 'readily' });
    const result = await checkAiCapabilities();
    expect(result.available).toBe('readily');
  });

  it('should return after-download if capabilities available is after-download', async () => {
    (ai.languageModel.capabilities as any).mockResolvedValue({ available: 'after-download' });
    const result = await checkAiCapabilities();
    expect(result.available).toBe('after-download');
  });

  it('should return no if capabilities available is no', async () => {
    (ai.languageModel.capabilities as any).mockResolvedValue({ available: 'no' });
    const result = await checkAiCapabilities();
    expect(result.available).toBe('no');
  });

  it('should return no if ai.languageModel is not available', async () => {
    vi.stubGlobal('ai', {});
    const result = await checkAiCapabilities();
    expect(result.available).toBe('no');
  });
});
