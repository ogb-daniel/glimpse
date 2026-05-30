import { AIStreamChunk } from "./ai";

export interface PageMetadata {
  url: string;
  title: string;
  h1s?: string[];
}

export type AppMessage =
  | { type: 'START_AI_STREAM'; payload: { contextText: string; metadata: PageMetadata } }
  | { type: 'AI_STREAM_CHUNK'; payload: AIStreamChunk }
  | { type: 'AI_STREAM_COMPLETE'; payload: { fullText: string } }
  | { type: 'AI_STREAM_ERROR'; payload: { success: false; error: string; code: string } };
