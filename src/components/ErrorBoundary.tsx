import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, componentName } = this.props;
    
    console.error('❌ [ErrorBoundary] Caught error:', {
      component: componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({ errorInfo });

    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    console.log('🔄 [ErrorBoundary] Retrying...', {
      component: this.props.componentName,
      retryCount: this.state.retryCount + 1
    });

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {componentName ? `${componentName} 加载失败` : '组件加载失败'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error?.message || '未知错误'}</p>
                {retryCount > 0 && (
                  <p className="mt-1 text-xs">已尝试 {retryCount} 次</p>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  重试加载
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && error?.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                    查看详细错误信息
                  </summary>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// 用于懒加载组件的简化版本
export const LazyErrorBoundary: React.FC<{
  children: ReactNode;
  name: string;
}> = ({ children, name }) => {
  return (
    <ErrorBoundary
      componentName={name}
      onError={(error, errorInfo) => {
        console.error(`❌ [LazyErrorBoundary] ${name} failed:`, {
          error: error.message,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

