import React from 'react'

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'card' | 'metrics'
  count?: number
}

export function LoadingState({ type = 'skeleton', count = 1 }: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner" />
        <style jsx>{`
          .loading-spinner-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #9ca3af;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          :global(.dark) .loading-spinner {
            border-color: #374151;
            border-top-color: #d1d5db;
          }
        `}</style>
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className="loading-cards">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="loading-card">
            <div className="loading-header">
              <div className="loading-icon pulse" />
              <div className="loading-title pulse" />
            </div>
            <div className="loading-description pulse" />
            <div className="loading-metrics">
              <div className="loading-metric pulse" />
              <div className="loading-metric pulse" />
            </div>
          </div>
        ))}
        <style jsx>{`
          .loading-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          @media (max-width: 480px) {
            .loading-cards {
              grid-template-columns: 1fr;
            }
          }
          .loading-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 0.875rem;
            background: #f9fafb;
          }
          :global(.dark) .loading-card {
            background: #1f2937;
            border-color: #374151;
          }
          .loading-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.375rem;
          }
          .loading-icon {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: #e5e7eb;
          }
          .loading-title {
            height: 14px;
            width: 60%;
            border-radius: 4px;
            background: #e5e7eb;
          }
          .loading-description {
            height: 12px;
            width: 100%;
            border-radius: 4px;
            background: #e5e7eb;
            margin-bottom: 0.625rem;
          }
          .loading-metrics {
            display: flex;
            gap: 0.375rem;
          }
          .loading-metric {
            height: 24px;
            flex: 1;
            border-radius: 4px;
            background: #e5e7eb;
          }
          :global(.dark) .loading-icon,
          :global(.dark) .loading-title,
          :global(.dark) .loading-description,
          :global(.dark) .loading-metric {
            background: #374151;
          }
          .pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  if (type === 'metrics') {
    return (
      <div className="loading-metrics-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="loading-metric-box pulse">
            <div className="loading-value" />
            <div className="loading-label" />
          </div>
        ))}
        <style jsx>{`
          .loading-metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
            gap: 0.5rem;
          }
          .loading-metric-box {
            padding: 0.625rem;
            border-radius: 6px;
            background: #1f2937;
            text-align: center;
          }
          .loading-value {
            height: 18px;
            width: 60%;
            margin: 0 auto 0.25rem;
            border-radius: 4px;
            background: #374151;
          }
          .loading-label {
            height: 10px;
            width: 80%;
            margin: 0 auto;
            border-radius: 4px;
            background: #374151;
          }
          .pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  // Default skeleton
  return (
    <div className="loading-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-row pulse" />
      ))}
      <style jsx>{`
        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .skeleton-row {
          height: 32px;
          border-radius: 6px;
          background: #e5e7eb;
        }
        :global(.dark) .skeleton-row {
          background: #374151;
        }
        .pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-icon">!</div>
      <div className="error-message">{message}</div>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
      <style jsx>{`
        .error-state {
          text-align: center;
          padding: 0.75rem;
          background: #1f2937;
          border-radius: 6px;
          border: 1px solid #6b7280;
        }
        .error-icon {
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .error-message {
          color: #d1d5db;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
        }
        .retry-button {
          padding: 0.375rem 0.75rem;
          background: #4b5563;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.75rem;
        }
        .retry-button:hover {
          background: #374151;
        }
      `}</style>
    </div>
  )
}
