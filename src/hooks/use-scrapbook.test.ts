/** @vitest-environment jsdom */
import 'fake-indexeddb/auto';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useScrapbook, type DbResult } from './use-scrapbook';
import { db } from '../shared/db/dexie-db';
import { UserScrapbook } from '../shared/types/models';

describe('useScrapbook', () => {
  beforeEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
  });

  afterEach(async () => {
    await db.delete();
  });

  it('should save interaction successfully', async () => {
    await db.open();
    const { result } = renderHook(() => useScrapbook());
    
    let response: DbResult<UserScrapbook> | undefined;
    await act(async () => {
      response = await result.current.saveInteraction({
        term: 'Test Term',
        explanation: 'Explanation',
        domainUrl: 'example.com',
      });
    });

    expect(response?.success).toBe(true);
    if (response?.success) {
      expect(response.data.id).toBeDefined();
    }

    const saved = await db.userScrapbook.toArray();
    expect(saved).toHaveLength(1);
    expect(saved[0].term).toBe('Test Term');
    expect(saved[0].learnedAt).toBeDefined();
  });

  it('should return error if save fails', async () => {
    // Database isn't open, Dexie might auto-open it. 
    // To simulate a failure, we can temporarily monkey-patch db.userScrapbook.add
    await db.open();
    const originalAdd = db.userScrapbook.add;
    db.userScrapbook.add = () => Promise.reject(new Error('Simulated failure')) as any;
    
    const { result } = renderHook(() => useScrapbook());

    let response: DbResult<UserScrapbook> | undefined;
    await act(async () => {
      response = await result.current.saveInteraction({
        term: 'Test Term',
        explanation: 'Explanation',
        domainUrl: 'example.com',
      });
    });

    expect(response?.success).toBe(false);
    if (response?.success === false) {
      expect(response.error).toBeDefined();
    }
    
    // Restore
    db.userScrapbook.add = originalAdd;
  });

  it('should delete interaction successfully', async () => {
    await db.open();
    const id = await db.userScrapbook.add({
      term: 'Test Term',
      explanation: 'Explanation',
      domainUrl: 'example.com',
      learnedAt: Date.now(),
    });

    const { result } = renderHook(() => useScrapbook());
    
    let response: DbResult<void> | undefined;
    await act(async () => {
      response = await result.current.deleteInteraction(id);
    });

    expect(response?.success).toBe(true);

    const saved = await db.userScrapbook.toArray();
    expect(saved).toHaveLength(0);
  });

  it('should return error if delete fails', async () => {
    await db.open();
    const originalDelete = db.userScrapbook.delete;
    db.userScrapbook.delete = () => Promise.reject(new Error('Simulated failure')) as any;
    
    const { result } = renderHook(() => useScrapbook());

    let response: DbResult<void> | undefined;
    await act(async () => {
      response = await result.current.deleteInteraction(1);
    });

    expect(response?.success).toBe(false);
    if (response?.success === false) {
      expect(response.error).toBeDefined();
    }
    
    // Restore
    db.userScrapbook.delete = originalDelete;
  });
});
