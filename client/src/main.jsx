import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FIA Mission Control RootErrorBoundary caught exception:', error, errorInfo);
  }

  handleRecovery = () => {
    try {
      localStorage.removeItem('gp_strategy_role');
      localStorage.removeItem('gp_strategy_team');
      localStorage.removeItem('gp_scoreboard_season_v1');
    } catch (_) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            background: 'radial-gradient(ellipse at center, #111625 0%, #06080e 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Orbitron', sans-serif",
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏁</div>
          <h2
            style={{
              color: '#e10600',
              fontSize: '1.4rem',
              margin: '0 0 10px 0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: '0 0 18px rgba(225,6,0,0.4)',
            }}
          >
            FIA MISSION CONTROL RECOVERY
          </h2>
          <p
            style={{
              color: '#94a3b8',
              maxWidth: '540px',
              fontSize: '0.88rem',
              margin: '0 0 24px 0',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: '600',
              lineHeight: '1.5',
            }}
          >
            A session state conflict was intercepted before display. Click below to refresh telemetry cache and reconnect to the 2026 Pit Wall.
          </p>
          <button
            onClick={this.handleRecovery}
            style={{
              background: 'linear-gradient(90deg, #e10600 0%, #ff3b30 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '6px',
              fontFamily: "'Orbitron', monospace",
              fontWeight: '900',
              fontSize: '0.82rem',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(225, 6, 0, 0.55)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🔄 RECONNECT TO PIT WALL
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
