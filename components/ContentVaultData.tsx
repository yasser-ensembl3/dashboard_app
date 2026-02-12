import React, { useState } from 'react'
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
  items: Array<{
    id: string
    title: string
    source: string
    type: string
    status: string
    url?: string
    lastEdited?: string
  }>
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

// Recent items list (clickable, sorted by recency)
export function ContentVaultItems() {
  const { data, loading, error, refetch } = useNotionData<ContentVaultResponse>('/api/contentvault')
  const [showAll, setShowAll] = useState(false)

  if (loading) return <LoadingState type="skeleton" count={5} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.items || data.items.length === 0) return null

  const sorted = [...data.items]
    .filter(i => i.lastEdited)
    .sort((a, b) => new Date(b.lastEdited!).getTime() - new Date(a.lastEdited!).getTime())

  const visible = showAll ? sorted : sorted.slice(0, 5)
  const hasMore = sorted.length > 5

  const statusColor = (status: string) => {
    if (status === 'To Read' || status === 'Inbox') return '#eab308'
    if (status === 'Done') return '#22c55e'
    return '#6b7280'
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <h3 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600' }}>Recent Items</h3>
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        {visible.map(item => {
          const Tag = item.url ? 'a' : 'div'
          const linkProps = item.url ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {}
          return (
            <Tag
              key={item.id}
              {...linkProps}
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#1f2937',
                borderRadius: '6px',
                fontSize: '0.75rem',
                borderLeft: `3px solid ${statusColor(item.status)}`,
                textDecoration: 'none',
                cursor: item.url ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={item.url ? (e: any) => { e.currentTarget.style.background = '#283344' } : undefined}
              onMouseLeave={item.url ? (e: any) => { e.currentTarget.style.background = '#1f2937' } : undefined}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'white', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  {item.url && <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>↗</span>}
                  {item.lastEdited && (
                    <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>
                      {new Date(item.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', paddingLeft: '0' }}>
                  <span style={{ padding: '0.0625rem 0.375rem', background: '#374151', color: '#9ca3af', borderRadius: '3px', fontSize: '0.5625rem' }}>{item.source}</span>
                  <span style={{ padding: '0.0625rem 0.375rem', background: '#374151', color: '#9ca3af', borderRadius: '3px', fontSize: '0.5625rem' }}>{item.type}</span>
                  <span style={{ padding: '0.0625rem 0.375rem', background: statusColor(item.status) + '22', color: statusColor(item.status), borderRadius: '3px', fontSize: '0.5625rem' }}>{item.status}</span>
                </div>
              </div>
            </Tag>
          )
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'transparent',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#9ca3af',
            fontSize: '0.6875rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
        >
          {showAll ? 'Show less' : `See more (${sorted.length - 5} more items)`}
        </button>
      )}
    </div>
  )
}

// Header with link
export function ContentVaultHeader() {
  return <VaultLink url="https://media-minivault.vercel.app/vault" name="Media Vault" />
}

// Last updated timestamp
export function ContentVaultLastUpdated() {
  return (
    <div style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.625rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  )
}
