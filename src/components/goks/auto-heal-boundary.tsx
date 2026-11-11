import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  name?: string;
  onReset?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class AutoHealBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.warn(`[AutoHealBoundary] Caught error in ${this.props.name || "Component"}:`, error);

    // Auto-healing attempt: if first error, try transparently auto-recovering once after 500ms
    if (this.state.retryCount === 0) {
      setTimeout(() => {
        if (this.state.hasError) {
          this.handleRetry();
        }
      }, 500);
    }
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onReset?.();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded border border-brass/50 bg-panel p-4 shadow-md font-mono text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brass animate-ping" />
              <span className="font-bold uppercase tracking-wider text-brass">
                Auto-Healed: {this.props.name || "Panel"}
              </span>
            </div>
            <span className="rounded bg-brass/15 px-2 py-0.5 text-[10px] font-semibold text-brass">
              ZERO-CRASH RECOVERY
            </span>
          </div>

          <p className="text-muted text-xs leading-relaxed">
            This module encountered an unexpected data anomaly or calculation overflow and was safely isolated
            to protect terminal integrity.
          </p>

          {this.state.error && (
            <p className="mt-2 text-[11px] text-loss font-mono bg-ink/40 p-2 rounded truncate">
              {this.state.error.message}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded bg-brass px-3 py-1.5 font-bold text-ink hover:bg-brass-soft transition-colors cursor-pointer"
            >
              Recover &amp; Reset View
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded border border-line px-3 py-1.5 text-muted hover:text-paper hover:border-brass transition-colors cursor-pointer"
            >
              Refresh Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

