import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from './dexie-db';
import { UserScrapbook } from '../types/models';

describe('GlimpseDatabase', () => {
  beforeEach(async () => {
    // Make sure we have a fresh DB state
    if (db.isOpen()) {
      await db.close();
    }
  });

  afterEach(async () => {
    await db.delete();
  });

  it('should initialize with the correct schema', async () => {
    await db.open();
    const table = db.userScrapbook;
    
    expect(table.schema.primKey.name).toBe('id');
    expect(table.schema.primKey.auto).toBe(true);
    
    const indexes = table.schema.indexes.map(idx => idx.name);
    expect(indexes).toContain('term');
    expect(indexes).toContain('domainUrl');
    expect(indexes).toContain('learnedAt');
    // explanation should not be indexed based on dev notes
    expect(indexes).not.toContain('explanation');
  });

  it('should auto-assign ids and save interactions', async () => {
    await db.open();
    
    const entry: Omit<UserScrapbook, 'id'> = {
      term: 'Test Term',
      explanation: 'Test Explanation',
      domainUrl: 'https://example.com',
      learnedAt: Date.now()
    };
    
    const id = await db.userScrapbook.add(entry as UserScrapbook);
    expect(id).toBeDefined();
    expect(typeof id).toBe('number');

    const retrieved = await db.userScrapbook.get(id);
    expect(retrieved).toMatchObject(entry);
    expect(retrieved?.id).toBe(id);
  });
});
