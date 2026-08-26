/* ============================================================
   OpenAI-compatible chat-completions provider.
   Works with OpenAI, Ollama, LM Studio, vLLM, or any server
   that implements POST {baseUrl}/chat/completions.
   ============================================================ */

import {
  AIProvider, AIProviderError, AICompletionOptions, AIProviderConfig,
} from '../types';

export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    public readonly kind: 'openai' | 'custom',
    public readonly privacy: 'device' | 'cloud',
    private getConfig: () => AIProviderConfig,
  ) {}

  private get baseUrl(): string {
    return this.getConfig().baseUrl.replace(/\/+$/, '');
  }

  async check(): Promise<{ ok: boolean; detail: string }> {
    const cfg = this.getConfig();
    if (!cfg.baseUrl) return { ok: false, detail: 'No server URL configured.' };
    if (!cfg.model) return { ok: false, detail: 'No model configured.' };
    if (this.kind === 'openai' && !cfg.apiKey) return { ok: false, detail: 'No API key configured.' };
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return { ok: false, detail: `Server responded ${res.status}.` };
      return { ok: true, detail: cfg.model };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : 'Unreachable.' };
    }
  }

  async complete(opts: AICompletionOptions): Promise<string> {
    const cfg = this.getConfig();
    if (!cfg.baseUrl || !cfg.model) {
      throw new AIProviderError('AI provider not configured. Configure an AI provider in Settings.');
    }
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: cfg.model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? 1024,
          stream: false,
        }),
        signal: opts.signal,
      });
    } catch (e) {
      throw new AIProviderError(
        e instanceof Error && e.name === 'AbortError' ? 'Request cancelled.' : `Could not reach ${this.baseUrl}.`,
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new AIProviderError(`Provider error ${res.status}. ${body.slice(0, 160)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (data.error?.message) throw new AIProviderError(data.error.message);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AIProviderError('Provider returned an empty response.');
    return content;
  }

  private headers(): Record<string, string> {
    const cfg = this.getConfig();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) h.Authorization = `Bearer ${cfg.apiKey}`;
    return h;
  }
}
