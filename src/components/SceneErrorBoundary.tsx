"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for the 3D scene
 * Catches WebGL and Three.js errors and displays a fallback UI
 * Prevents the entire app from crashing due to graphics errors
 */
export class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Scene error:", error, errorInfo);
  }

  /**
   * Handle retry button click
   * Resets error state and attempts to reload the scene
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="canvas-container flex items-center justify-center bg-obsidian">
          <div className="text-center px-6 max-w-md">
            {/* Error icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-lava/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-lava"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error message */}
            <h2 className="text-xl font-display text-cream mb-3">
              3D Scene Error
            </h2>
            <p className="text-silver/70 mb-6">
              The 3D visualization couldn&apos;t load. This usually happens when
              WebGL isn&apos;t available or your graphics driver needs updating.
            </p>

            {/* Error details (collapsed) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-silver/50 text-sm cursor-pointer hover:text-silver transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-white/5 rounded-lg text-xs text-silver/60 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-lava/20 hover:bg-lava/30 border border-lava/30 rounded-xl text-cream transition-all duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-silver transition-all duration-200"
              >
                Reload Page
              </button>
            </div>

            {/* WebGL check hint */}
            <p className="mt-6 text-xs text-silver/40">
              Check if{" "}
              <a
                href="https://get.webgl.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lava/70 hover:text-lava underline"
              >
                WebGL is supported
              </a>{" "}
              in your browser.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
