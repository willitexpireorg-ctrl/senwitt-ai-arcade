import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI exception in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="glass-panel p-8 max-w-md w-full text-center border border-rose-500/30">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Cognitive Session Recovered</h2>
            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              An unexpected execution anomaly occurred. The system preserved your current session state.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 mb-6 text-left font-mono text-[11px] text-rose-300 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload & Resume App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
