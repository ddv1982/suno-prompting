import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('PanelErrorBoundary');

interface Props {
  children: ReactNode;
  /** Name of the panel for error logging */
  panelName: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for individual panels/sections.
 * Catches errors within a panel without crashing the entire application.
 * 
 * Use this around major UI sections (prompt editor, history sidebar, etc.)
 * to provide graceful degradation when a section fails.
 * 
 * @example
 * <PanelErrorBoundary panelName="PromptEditor">
 *   <PromptEditor />
 * </PanelErrorBoundary>
 */
export class PanelErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error(`${this.props.panelName}:error`, {
      error,
      componentStack: info.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-3 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {this.props.panelName} encountered an error
            </p>
            <p className="text-xs text-muted-foreground/70">
              {this.state.error?.message || 'Something went wrong'}
            </p>
          </div>
          <Button onClick={this.handleRetry} variant="ghost" size="sm">
            <RefreshCcw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
