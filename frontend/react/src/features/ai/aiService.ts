/* ============================================================
   AI service — resolves the configured provider, persists the
   config locally, and exposes a single completion entry point.
   ============================================================ */

import {
  AIProvider, AIProviderConfig, AIChatMessage, DEFAULT_AI_CONFIG,
  PROVIDER_PRESETS, AIContextScope, AIProviderError,
} from './types';
import { OpenAICompatibleProvider } from './providers/openaiCompatible';
import { LocalProvider } from './providers/localProvider';

const CONFIG_KEY = 'word.ai.config';
const SCOPE_KEY = 'word.ai.contextScope';

class AIService {
  private config: AIProviderConfig = DEFAULT_AI_CONFIG;
  private localProvider = new LocalProvider();
  private cloudProvider = new OpenAICompatibleProvider('openai', 'cloud', () => this.config);
  private customProvider = new OpenAICompatibleProvider('custom', 'cloud', () => this.config);

  constructor() {
    this.config = this.loadConfig();
  }

  /* ---------- config ---------- */

  private loadConfig(): AIProviderConfig {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return { ...DEFAULT_AI_CONFIG };
      return { ...DEFAULT_AI_CONFIG, ...(JSON.parse(raw) as Partial<AIProviderConfig>) };
    } catch {
      return { ...DEFAULT_AI_CONFIG };
    }
  }

  get configSnapshot(): AIProviderConfig {
    return { ...this.config };
  }

  setConfig(cfg: AIProviderConfig): void {
    this.config = { ...cfg };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch {
      /* non-fatal */
    }
  }

  applyPreset(presetId: string): AIProviderConfig {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return this.configSnapshot;
    const next: AIProviderConfig = {
      kind: preset.kind,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
      apiKey: preset.needsKey ? this.config.apiKey : '',
    };
    this.setConfig(next);
    return next;
  }

  /* ---------- context scope ---------- */

  getContextScope(): AIContextScope {
    try {
      return (localStorage.getItem(SCOPE_KEY) as AIContextScope) || 'selection';
    } catch {
      return 'selection';
    }
  }

  setContextScope(scope: AIContextScope): void {
    try {
      localStorage.setItem(SCOPE_KEY, scope);
    } catch {
      /* non-fatal */
    }
  }

  /* ---------- provider resolution ---------- */

  get provider(): AIProvider {
    switch (this.config.kind) {
      case 'openai': return this.cloudProvider;
      case 'custom': return this.customProvider;
      case 'local':
      default: return this.localProvider;
    }
  }

  get privacy(): 'device' | 'cloud' {
    return this.provider.privacy;
  }

  get isConfigured(): boolean {
    if (this.config.kind === 'local') return true;
    return !!this.config.baseUrl && !!this.config.model && (this.config.kind !== 'openai' || !!this.config.apiKey);
  }

  notConfiguredMessage(): string {
    return 'AI provider not configured.\n\nConfigure an AI provider in Settings → AI & Privacy, or switch to the on-device tools.';
  }

  async check(): Promise<{ ok: boolean; detail: string }> {
    return this.provider.check();
  }

  async complete(messages: AIChatMessage[], opts?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }): Promise<string> {
    if (!this.isConfigured) throw new AIProviderError(this.notConfiguredMessage());
    return this.provider.complete({ messages, ...opts });
  }
}

export const aiService = new AIService();
