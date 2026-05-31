import { AIStreamChunk } from "./ai";

export interface PageMetadata {
  url: string;
  title: string;
  h1s?: string[];
  surroundingText?: string;
}

export interface BloomContext {
  term: string;
  explanation: string;
  metadata: PageMetadata;
  timestamp: number;
}

export type AppMessage =
  | { type: 'START_AI_STREAM'; payload: { contextText: string; metadata: PageMetadata } }
  | { type: 'ELABORATE_AI_STREAM'; payload: { contextText: string; metadata: PageMetadata } }
  | { type: 'CONTINUE_AI_STREAM'; payload: { prompt: string; history: { role: 'user' | 'assistant'; content: string }[]; metadata: PageMetadata } }
  | { type: 'AI_STREAM_CHUNK'; payload: AIStreamChunk }
  | { type: 'AI_STREAM_COMPLETE'; payload: { fullText: string } }
  | { type: 'AI_STREAM_ERROR'; payload: { success: false; error: string; code: string } }
  | { type: 'OPEN_SIDE_PANEL' }
  | { type: 'GET_TAB_ID' };
