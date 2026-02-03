import React from 'react'
import { MetricsDisplay } from './MetricsDisplay'
import { VaultLink } from './VaultLink'

interface VaultMetrics {
  [key: string]: number | string
}

interface VaultCardProps {
  name: string
  description: string
  url: string
  metrics: VaultMetrics
  icon?: string
}

export function VaultCard({ name, description, url, metrics, icon = '' }: VaultCardProps) {
  return (
    <div className="vault-card">
      <div className="vault-header">
        {icon && <span className="vault-icon">{icon}</span>}
        <h3 className="vault-name">{name}</h3>
      </div>
      <p className="vault-description">{description}</p>
      <MetricsDisplay metrics={metrics} />
      <VaultLink url={url} name={name} />
      <style jsx>{`
        .vault-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.875rem;
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .vault-card:hover {
          border-color: #6b7280;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transform: translateY(-1px);
        }
        :global(.dark) .vault-card {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-color: #374151;
        }
        :global(.dark) .vault-card:hover {
          border-color: #9ca3af;
        }
        .vault-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.375rem;
        }
        .vault-icon {
          font-size: 1rem;
        }
        .vault-name {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        :global(.dark) .vault-name {
          color: #f9fafb;
        }
        .vault-description {
          color: #6b7280;
          font-size: 0.75rem;
          margin-bottom: 0.625rem;
          line-height: 1.4;
        }
        :global(.dark) .vault-description {
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
