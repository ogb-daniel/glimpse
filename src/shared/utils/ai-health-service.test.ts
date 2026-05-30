import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAiCapabilities } from './ai-health-service';

describe('ai-health-service', () => {
  beforeEach(() => {
    vi.stubGlobal('LanguageModel', {
      availability: vi.fn(),
    });
  });

  it('should return available if availability is available', async () => {
    (LanguageModel as any).availability.mockResolvedValue('available');
    const result = await checkAiCapabilities();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe('available');
    }
  });

  it('should return downloadable if availability is downloadable', async () => {
    (LanguageModel as any).availability.mockResolvedValue('downloadable');
    const result = await checkAiCapabilities();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe('downloadable');
    }
  });

  it('should return success: true if availability is unavailable', async () => {
    (LanguageModel as any).availability.mockResolvedValue('unavailable');
    const result = await checkAiCapabilities();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe('unavailable');
    }
  });

  it('should return success: false if LanguageModel is not available', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const result = await checkAiCapabilities();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('UNSUPPORTED');
    }
  });
});
