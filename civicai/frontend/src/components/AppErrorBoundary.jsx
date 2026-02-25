import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('CivicAI frontend crash:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-slate-950 text-white p-6">
          <div className="max-w-2xl rounded-2xl border border-red-300/40 bg-red-500/10 p-6">
            <h1 className="text-2xl font-bold mb-2">UI failed to render</h1>
            <p className="text-sm text-red-100/90 mb-3">
              A runtime frontend error occurred. Open browser console (F12) and share the first red error line.
            </p>
            <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded-lg overflow-auto">
              {String(this.state.error || 'Unknown frontend error')}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
