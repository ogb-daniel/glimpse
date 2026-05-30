import { useCallback } from 'react';
import { db } from '../shared/db/dexie-db';
import { UserScrapbook } from '../shared/types/models';

export type DbResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export function useScrapbook() {
  const saveInteraction = useCallback(async (
    interaction: Omit<UserScrapbook, 'id' | 'learnedAt'>
  ): Promise<DbResult<UserScrapbook>> => {
    try {
      const entry = {
        ...interaction,
        learnedAt: Date.now()
      };
      
      const id = await db.userScrapbook.add(entry);
      
      return {
        success: true,
        data: {
          ...entry,
          id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }, []);

  return {
    saveInteraction
  };
}
