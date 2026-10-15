import { query } from '../db/pool';
import { logger } from '../config/logger';

export interface LlmCallEntry {
  userId?: string | null;
  purpose: string; // e.g. 'post_generation', 'visual_prompts', 'guardrail_eval'
  model: string;
  provider?: string;
  prompt: string;
  responsePreview?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  latencyMs?: number;
  status?: 'success' | 'failed' | 'timeout' | 'guardrail_flagged';
  lastError?: string;
  embeddingModel?: string;
  embeddings?: number[];
  metadata?: Record<string, any>;
}

export class LlmLoggerService {
  private static instance: LlmLoggerService;

  private constructor() {}

  public static getInstance(): LlmLoggerService {
    if (!LlmLoggerService.instance) {
      LlmLoggerService.instance = new LlmLoggerService();
    }
    return LlmLoggerService.instance;
  }

  /**
   * Helper to compute estimated cost for popular AI models if not supplied
   */
  public calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const m = model.toLowerCase();
    // Default pricing per 1M tokens (USD)
    let inputCostPerMillion = 0.15; // default gemini-flash
    let outputCostPerMillion = 0.60;

    if (m.includes('pro') || m.includes('gpt-4o')) {
      inputCostPerMillion = 2.50;
      outputCostPerMillion = 10.00;
    } else if (m.includes('flash') || m.includes('mini')) {
      inputCostPerMillion = 0.075;
      outputCostPerMillion = 0.30;
    }

    const inputCost = (promptTokens / 1_000_000) * inputCostPerMillion;
    const outputCost = (completionTokens / 1_000_000) * outputCostPerMillion;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Records an LLM call into the observability table llm_calls
   */
  async record(entry: LlmCallEntry): Promise<void> {
    try {
      const promptTokens = entry.promptTokens || 0;
      const completionTokens = entry.completionTokens || 0;
      const totalTokens = entry.totalTokens || (promptTokens + completionTokens);
      const estimatedCost = entry.estimatedCostUsd ?? this.calculateCost(entry.model, promptTokens, completionTokens);

      await query(
        `INSERT INTO llm_calls (
          user_id, purpose, model, provider, prompt, response_preview,
          prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd,
          latency_ms, status, last_error, embedding_model, embeddings, metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, NOW()
        )`,
        [
          entry.userId || null,
          entry.purpose,
          entry.model,
          entry.provider || 'google',
          entry.prompt,
          entry.responsePreview ? entry.responsePreview.slice(0, 1000) : null,
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCost,
          entry.latencyMs || 0,
          entry.status || 'success',
          entry.lastError || null,
          entry.embeddingModel || 'text-embedding-004',
          entry.embeddings && entry.embeddings.length > 0 ? entry.embeddings : null,
          JSON.stringify(entry.metadata || {})
        ]
      );
    } catch (err: any) {
      logger.error({ err: err.message, purpose: entry.purpose, model: entry.model }, 'Failed to record LLM call observability record');
    }
  }
}

export const llmLogger = LlmLoggerService.getInstance();
