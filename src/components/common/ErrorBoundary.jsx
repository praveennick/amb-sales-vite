import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="panel mx-auto my-12 max-w-lg space-y-4">
          <h1 className="text-xl font-semibold">This page couldn’t load</h1>
          <p className="text-slate-600">
            Please reload to try again. Unsaved changes may be lost.
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    return this.props.children;
  }
}
