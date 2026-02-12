import React, { useState } from 'react'
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
    authors: string
    subject: string
    description?: string
    submission?: string
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
      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>Saved Articles</div>
      <div style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.75rem' }}>Database active</div>
    </div>
  )
}

// Items list with expandable details
export function DataVaultItems() {
  const { data, loading, error, refetch } = useNotionData<DataVaultResponse>('/api/datavault')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) return <LoadingState type="skeleton" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.items || data.items.length === 0) return null

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <h3 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600' }}>Saved Articles</h3>
      {data.items.map(item => {
        const isExpanded = expandedId === item.id
        return (
          <div key={item.id} style={{ marginBottom: '0.375rem', borderRadius: '6px', overflow: 'hidden', border: isExpanded ? '1px solid #374151' : '1px solid transparent', transition: 'border-color 0.2s' }}>
            <div
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              style={{
                padding: '0.625rem',
                background: '#1f2937',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = '#283344' }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = '#1f2937' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontWeight: '500', wordBreak: 'break-word' }}>{item.title}</div>
                  <div style={{ color: '#9ca3af', fontSize: '0.625rem', marginTop: '0.25rem' }}>
                    {item.authors && <span>{item.authors}</span>}
                    {item.authors && item.subject && <span> · </span>}
                    {item.subject && <span>{item.subject}</span>}
                  </div>
                </div>
                {item.submission && (
                  <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>
                    {new Date(item.submission).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: '0.75rem 0.75rem 0.75rem 1.75rem', background: '#111827', borderTop: '1px solid #374151', fontSize: '0.75rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {item.description && (
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.625rem' }}>Description</span>
                      <div style={{ color: '#d1d5db', lineHeight: '1.4' }}>{item.description}</div>
                    </div>
                  )}
                  {item.authors && (
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.625rem' }}>Authors</span>
                      <div style={{ color: '#d1d5db' }}>{item.authors}</div>
                    </div>
                  )}
                  {item.subject && (
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.625rem' }}>Subject</span>
                      <div style={{ color: '#d1d5db' }}>{item.subject}</div>
                    </div>
                  )}
                  {item.submission && (
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.625rem' }}>Submitted</span>
                      <div style={{ color: '#d1d5db' }}>{new Date(item.submission).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  )}
                </div>

                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      marginTop: '0.75rem',
                      padding: '0.375rem 0.75rem',
                      background: '#2563eb',
                      color: 'white',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '0.6875rem',
                      fontWeight: '500',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = '#3b82f6' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = '#2563eb' }}
                  >
                    View PDF ↗
                  </a>
                ) : (
                  <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.625rem', fontStyle: 'italic' }}>
                    No PDF link available
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Header with link
export function DataVaultHeader() {
  return <VaultLink url="https://datavault-rust.vercel.app/areas" name="Research Vault" />
}

// About section (static content)
export function DataVaultAbout() {
  return (
    <>
      <h2 style={{ fontSize: '0.875rem' }}>About Research Vault</h2>
      <p style={{ fontSize: '0.75rem' }}>Research Vault is your personal research hub. Use it to discover, save and revisit:</p>
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
