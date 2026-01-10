import { RefreshCcw } from 'lucide-react';
import React, { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('ErrorBoundary');

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    override state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, info: React.ErrorInfo): void {
        log.error('boundary:error', { 
            error, 
            componentStack: info.componentStack 
        });
    }

    handleRestart = (): void => {
        window.location.reload();
    };

    override render(): ReactNode {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 p-8 text-center bg-background">
                    <div className="max-w-md space-y-2">
                        <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            {this.state.error?.message || 'An unexpected error occurred in the application interface.'}
                        </p>
                    </div>
                    <Button onClick={this.handleRestart} variant="outline">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reload Application
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}
