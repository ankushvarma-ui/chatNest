import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="join-page d-flex align-items-center justify-content-center p-4">
          <div className="panel p-4 text-center">
            <h1 className="h3">Something went wrong</h1>
            <p className="text-secondary">
              Reload the page to reconnect to ChatNest.
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
