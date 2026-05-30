export type AIResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export interface AIStreamChunk {
  token: string;
  isComplete: boolean;
}
