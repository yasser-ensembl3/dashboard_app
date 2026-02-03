import React from 'react'
import { useNotionData } from '../hooks/useNotionData'
import { LoadingState, ErrorState } from './LoadingState'
import { VaultLink } from './VaultLink'

interface DataVaultResponse {
  metrics: {
    totalItems: number
  }
  status: string
  items: Array<{
    id: string
    title: string
    category: string
    status: string
    url?: string
  }>
}

// Status display
export function DataVaultStatus() {
  const { data, loading, error, refetch } = useNotionData<DataVaultResponse>('/api/datavault')

  if (loading) return <LoadingState type="skeleton" count={1} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  if (data.status === 'empty' || data.metrics.totalItems === 0) {
    return (
      <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', margin: '0.75rem 0' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>Empty Database</div>
        <div style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.75rem' }}>No research results yet</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', margin: '0.75rem 0' }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>{data.metrics.totalItems} Research Items</div>
      <div style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.75rem' }}>Database active</div>
    </div>
  )
}

// Items list (if any)
export function DataVaultItems() {
  const { data, loading, error, refetch } = useNotionData<DataVaultResponse>('/api/datavault')

  if (loading) return <LoadingState type="skeleton" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.items || data.items.length === 0) return null

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Research Items</h3>
      {data.items.map(item => (
        <div key={item.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', marginBottom: '0.25rem', fontSize: '0.75rem', gap: '0.25rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '0' }}>
            <div style={{ color: 'white', fontWeight: '500', wordBreak: 'break-word' }}>{item.title}</div>
            <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>{item.category}</div>
          </div>
          <span style={{ padding: '0.125rem 0.5rem', background: '#4b5563', color: 'white', borderRadius: '999px', fontSize: '0.625rem', flexShrink: 0 }}>{item.status}</span>
        </div>
      ))}
    </div>
  )
}

// Header with link
export function DataVaultHeader() {
  return <VaultLink url="https://datavault-rust.vercel.app/vault" name="DataVault" />
}

// About section (static content)
export function DataVaultAbout() {
  return (
    <>
      <h2 style={{ fontSize: '0.875rem' }}>About DataVault</h2>
      <p style={{ fontSize: '0.75rem' }}>DataVault is your research results database. Use it to store and organize:</p>
      <div style={{ display: 'grid', gap: '0.375rem', marginTop: '0.5rem' }}>
        <div style={{ padding: '0.5rem', background: '#1f2937', borderLeft: '3px solid #6b7280', borderRadius: '0 6px 6px 0', color: 'white', fontSize: '0.75rem' }}>
          Research papers and articles
        </div>
        <div style={{ padding: '0.5rem', background: '#1f2937', borderLeft: '3px solid #6b7280', borderRadius: '0 6px 6px 0', color: 'white', fontSize: '0.75rem' }}>
          Documentation and references
        </div>
        <div style={{ padding: '0.5rem', background: '#1f2937', borderLeft: '3px solid #6b7280', borderRadius: '0 6px 6px 0', color: 'white', fontSize: '0.75rem' }}>
          Notes and findings
        </div>
        <div style={{ padding: '0.5rem', background: '#1f2937', borderLeft: '3px solid #6b7280', borderRadius: '0 6px 6px 0', color: 'white', fontSize: '0.75rem' }}>
          Links and bookmarks
        </div>
      </div>
    </>
  )
}

// Last updated timestamp
export function DataVaultLastUpdated() {
  return (
    <div style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.625rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  )
}
