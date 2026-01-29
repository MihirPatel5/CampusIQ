import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    private handleReload = () => {
        window.location.reload()
    }

    private handleGoHome = () => {
        window.location.href = '/dashboard'
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="h-10 w-10 text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
                            <p className="text-muted-foreground">
                                We encountered an unexpected error. Our team has been notified.
                            </p>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg text-left overflow-auto max-h-40 text-xs font-mono border border-border/50">
                            {this.state.error?.message || 'Unknown error occurred'}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={this.handleReload} size="lg" className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Reload Page
                            </Button>
                            <Button onClick={this.handleGoHome} variant="outline" size="lg" className="gap-2">
                                <Home className="h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
