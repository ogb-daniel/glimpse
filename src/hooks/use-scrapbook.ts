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
      const existing = await db.userScrapbook.where('term').equalsIgnoreCase(interaction.term).first();
      
      if (existing && existing.id !== undefined) {
        const updated = { ...existing, explanation: interaction.explanation, domainUrl: interaction.domainUrl, learnedAt: Date.now() };
        await db.userScrapbook.put(updated);
        return { success: true, data: updated };
      }

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

  const deleteInteraction = useCallback(async (id: number): Promise<DbResult<void>> => {
    try {
      await db.userScrapbook.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }, []);

  const getInteractionByTerm = useCallback(async (term: string): Promise<DbResult<UserScrapbook | undefined>> => {
    try {
      const entry = await db.userScrapbook.where('term').equalsIgnoreCase(term).first();
      return { success: true, data: entry };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }, []);

  return {
    saveInteraction,
    deleteInteraction,
    getInteractionByTerm
  };
}
