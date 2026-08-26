/* ============================================================
   AI provider abstraction — no provider is hard-coded.
   The document never leaves the device unless the user
   explicitly configures and selects a cloud provider.
   ============================================================ */

export type AIProviderKind = 'local' | 'openai' | 'custom';

/** What part of the document the AI is allowed to see. */
export type AIContextScope =
  | 'selection'
  | 'paragraph'
  | 'section'
  | 'page'
  | 'document';

export interface AIProviderConfig {
  kind: AIProviderKind;
  /** Base URL for OpenAI-compatible APIs (api.openai.com, Ollama, LM Studio…) */
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  kind: 'local',
  baseUrl: '',
  apiKey: '',
  model: '',
};

export const PROVIDER_PRESETS: {
  id: string;
  label: string;
  kind: AIProviderKind;
  baseUrl: string;
  defaultModel: string;
  needsKey: boolean;
  privacy: 'device' | 'cloud';
}[] = [
  { id: 'local', label: 'Local (on-device)', kind: 'local', baseUrl: '', defaultModel: '', needsKey: false, privacy: 'device' },
  { id: 'ollama', label: 'Ollama (local server)', kind: 'custom', baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3.2', needsKey: false, privacy: 'device' },
  { id: 'openai', label: 'OpenAI', kind: 'openai', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', needsKey: true, privacy: 'cloud' },
  { id: 'custom', label: 'Custom (OpenAI-compatible)', kind: 'custom', baseUrl: '', defaultModel: '', needsKey: false, privacy: 'cloud' },
];

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly kind: AIProviderKind;
  readonly privacy: 'device' | 'cloud';
  /** Human-readable status; ok=false means the provider cannot serve requests. */
  check(): Promise<{ ok: boolean; detail: string }>;
  complete(opts: AICompletionOptions): Promise<string>;
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIProviderError';
  }
}
