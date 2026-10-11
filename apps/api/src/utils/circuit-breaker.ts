import { logger } from '../config/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures to trip open (default: 5)
  successThreshold?: number; // Number of consecutive successes in half-open to close (default: 2)
  resetTimeoutMs?: number;   // Time to stay open before half-open probe (default: 30000ms)
  timeoutMs?: number;        // Individual call timeout (default: 10000ms)
}

export class CircuitBreaker {
  public state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private name: string;
  private options: Required<CircuitBreakerOptions>;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      resetTimeoutMs: options.resetTimeoutMs ?? 30000,
      timeoutMs: options.timeoutMs ?? 10000
    };
  }

  async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        logger.info({ breaker: this.name }, 'Circuit breaker transitioning to HALF_OPEN to probe upstream');
      } else {
        logger.warn({ breaker: this.name, retryInMs: this.nextAttempt - Date.now() }, 'Circuit breaker is OPEN - failing fast');
        if (fallback) return fallback();
        throw new Error(`Circuit breaker [${this.name}] is OPEN. Upstream service is temporarily unavailable.`);
      }
    }

    try {
      const result = await Promise.race([
        action(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${this.options.timeoutMs}ms`)), this.options.timeoutMs)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure(error);
      if (fallback) return fallback();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logger.info({ breaker: this.name }, 'Circuit breaker fully recovered. State: CLOSED');
      }
    }
  }

  private onFailure(error: any) {
    this.failureCount++;
    logger.error({ breaker: this.name, failures: this.failureCount, err: error.message }, 'Circuit breaker recorded upstream failure');

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
      logger.error({ breaker: this.name, resetInMs: this.options.resetTimeoutMs }, 'Circuit breaker tripped! State: OPEN');
    }
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}
