import React from 'react'
import { useNotionData } from '../hooks/useNotionData'
import { LoadingState, ErrorState } from './LoadingState'
import { VaultLink } from './VaultLink'

interface ContentVaultResponse {
  metrics: {
    totalItems: number
    toRead: number
    inbox: number
  }
  bySource: Array<{ source: string; count: number }>
  byType: Array<{ type: string; count: number }>
}

// Main metrics display
export function ContentVaultMetrics() {
  const { data, loading, error, refetch } = useNotionData<ContentVaultResponse>('/api/contentvault')

  if (loading) return <LoadingState type="metrics" count={3} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', margin: '0.75rem 0' }}>
      <div style={{ background: '#374151', padding: '0.625rem', borderRadius: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white' }}>{data.metrics.totalItems}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.25rem' }}>TOTAL ITEMS</div>
      </div>
      <div style={{ background: '#374151', padding: '0.625rem', borderRadius: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white' }}>{data.metrics.toRead}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.25rem' }}>TO READ</div>
      </div>
      <div style={{ background: '#374151', padding: '0.625rem', borderRadius: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white' }}>{data.metrics.inbox}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.25rem' }}>INBOX</div>
      </div>
    </div>
  )
}

// Content by source
export function ContentVaultBySource() {
  const { data, loading, error, refetch } = useNotionData<ContentVaultResponse>('/api/contentvault')

  if (loading) return <LoadingState type="skeleton" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.bySource.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', fontSize: '0.75rem' }}>
        No content sources yet
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.375rem', marginTop: '0.5rem' }}>
      {data.bySource.map(item => (
        <div key={item.source} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', fontSize: '0.75rem' }}>
          <span style={{ color: 'white' }}>{item.source}</span>
          <span style={{ color: 'white', fontWeight: 'bold' }}>{item.count}</span>
        </div>
      ))}
    </div>
  )
}

// Content by type
export function ContentVaultByType() {
  const { data, loading, error, refetch } = useNotionData<ContentVaultResponse>('/api/contentvault')

  if (loading) return <LoadingState type="skeleton" count={2} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.byType.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', fontSize: '0.75rem' }}>
        No content types yet
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {data.byType.map(item => (
        <div key={item.type} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', marginBottom: '0.25rem', fontSize: '0.75rem', gap: '0.25rem' }}>
          <span style={{ color: 'white', wordBreak: 'break-word' }}>{item.type}</span>
          <span style={{ padding: '0.125rem 0.5rem', background: '#4b5563', color: 'white', borderRadius: '999px', fontSize: '0.625rem', flexShrink: 0 }}>{item.count}</span>
        </div>
      ))}
    </div>
  )
}

// Header with link
export function ContentVaultHeader() {
  return <VaultLink url="https://media-minivault.vercel.app/vault" name="ContentVault" />
}

// Last updated timestamp
export function ContentVaultLastUpdated() {
  return (
    <div style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.625rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  )
}
