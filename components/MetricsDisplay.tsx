import React from 'react'

interface MetricsDisplayProps {
  metrics: {
    [key: string]: number | string
  }
}

const metricLabels: { [key: string]: string } = {
  totalDocs: 'Documents',
  totalItems: 'Total Items',
  recentUpdates: 'Recent Updates',
  articles: 'Articles',
  videos: 'Videos',
  podcasts: 'Podcasts',
  analyses: 'Analyses',
  kpis: 'KPIs',
  tasks: 'Tasks',
  tasksCompleted: 'Completed',
  tasksPending: 'Pending',
  goals: 'Goals',
  metrics: 'Metrics',
  orders: 'Orders',
  unfulfilled: 'Unfulfilled',
  reviews: 'Reviews',
  shopifySales: 'Shopify',
  amazonSales: 'Amazon Sales',
  amazonReviews: 'Amazon Reviews',
  toRead: 'To Read',
  inbox: 'Inbox',
  companies: 'Companies',
  stockCompanies: 'Stock',
  investmentCompanies: 'Investments',
  quarters: 'Quarters',
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const entries = Object.entries(metrics)

  if (entries.length === 0) {
    return (
      <div className="metrics-empty">
        <span>No metrics available</span>
        <style jsx>{`
          .metrics-empty {
            color: #9ca3af;
            font-size: 0.875rem;
            font-style: italic;
            padding: 0.5rem 0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="metrics-grid">
      {entries.map(([key, value]) => (
        <div key={key} className="metric-item">
          <span className="metric-value">{value}</span>
          <span className="metric-label">{metricLabels[key] || key}</span>
        </div>
      ))}
      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
          gap: 0.375rem;
          margin-bottom: 0.625rem;
        }
        .metric-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.375rem;
          background: #f3f4f6;
          border-radius: 6px;
          text-align: center;
        }
        :global(.dark) .metric-item {
          background: #374151;
        }
        .metric-value {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }
        :global(.dark) .metric-value {
          color: #ffffff;
        }
        .metric-label {
          font-size: 0.625rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          margin-top: 0.125rem;
        }
        :global(.dark) .metric-label {
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
