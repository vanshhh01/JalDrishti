import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white border border-slate-200 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl font-black">
            !
          </div>
          <h3 className="text-lg font-bold text-slate-900">Dashboard View Initializing</h3>
          <p className="text-xs text-slate-600">
            {this.state.error?.message || 'Recovering view state...'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Reload Dashboard Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
