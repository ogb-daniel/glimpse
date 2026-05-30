export interface PageMetadata {
  url: string;
  title: string;
  h1?: string;
}

export type AppMessage =
  | { type: 'START_AI_STREAM'; payload: { contextText: string; metadata: PageMetadata } }
  | { type: 'AI_STREAM_CHUNK'; payload: { token: string } }
  | { type: 'AI_STREAM_COMPLETE'; payload: { fullText: string } }
  | { type: 'AI_STREAM_ERROR'; payload: { error: string; code?: string } };
