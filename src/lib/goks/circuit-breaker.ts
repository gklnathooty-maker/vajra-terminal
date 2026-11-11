export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number; // consecutive failures before tripping
  resetTimeoutMs?: number;   // cool-off before testing half-open probe
  successThreshold?: number; // consecutive successes in half-open before closing
}

export interface CircuitHealthStatus {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  healthy: boolean;
  message: string;
}

export class FeedCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 25_000;
    this.successThreshold = options.successThreshold ?? 2;
  }

  public getState(): CircuitState {
    if (this.state === "OPEN" && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
      }
    }
    return this.state;
  }

  public getStatus(): CircuitHealthStatus {
    const currentState = this.getState();
    let message = "Feed Circuit Closed · Upstream Live Stream Healthy";
    if (currentState === "OPEN") {
      message = "Feed Circuit Tripped · Zero-Downtime Auto-Healing Active (Cached / Synthetic Feed)";
    } else if (currentState === "HALF_OPEN") {
      message = "Feed Circuit Probing · Testing Upstream Recovery";
    }

    return {
      state: currentState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      healthy: currentState === "CLOSED",
      message,
    };
  }

  public recordSuccess(): void {
    this.lastSuccessTime = Date.now();
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
      this.state = "CLOSED";
    }
  }

  public recordFailure(error?: unknown): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    this.successCount = 0;

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  public reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  public async execute<T>(
    operation: () => Promise<T>,
    fallback: (error?: unknown) => Promise<T> | T
  ): Promise<{ data: T; source: "live" | "fallback" }> {
    const currentState = this.getState();

    // Fast-fail to fallback if open, saving user from upstream timeouts
    if (currentState === "OPEN") {
      const fallbackResult = await fallback(new Error("Circuit breaker is OPEN"));
      return { data: fallbackResult, source: "fallback" };
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return { data: result, source: "live" };
    } catch (err) {
      this.recordFailure(err);
      const fallbackResult = await fallback(err);
      return { data: fallbackResult, source: "fallback" };
    }
  }
}

// Global shared circuit breaker for financial feeds
export const globalFeedCircuitBreaker = new FeedCircuitBreaker();

