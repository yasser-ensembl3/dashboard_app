import React, { useState } from 'react'
import { useNotionData, useMultipleNotionData } from '../hooks/useNotionData'
import { LoadingState, ErrorState } from './LoadingState'
import type { ContentVaultData, DataVaultData, MediaInsightsResponse, MediaInsightItem, DigestResponse, DigestDetail } from '../lib/types'

interface OrdersData {
  orders: Array<{
    id: string
    name: string
    total: string
    date: string
    url?: string
  }>
  count: number
}

interface DashboardData {
  taoStatus: {
    metrics: {
      unfulfilled: number
      amazonSales: number
      amazonReviews: number
      shopifySales: string
    }
    goals: {
      amazonSales: number
      amazonComReviews: number
      amazonCaReviews: number
      subscribers: number
    }
  }
}

interface TasksData {
  tasks: Array<{
    title: string
    priority: string
    due: string
    url?: string
  }>
}

// Action Required Banner
export function ActionRequiredBanner() {
  const { data, loading, error, refetch } = useNotionData<OrdersData>('/api/tao/orders?filter=unfulfilled')

  if (loading) {
    return (
      <div style={{ background: '#1f2937', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <LoadingState type="skeleton" count={2} />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.orders.length) return null

  return (
    <div style={{ background: '#374151', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'white' }}>!</span>
        <strong style={{ color: 'white', fontSize: '0.875rem' }}>{data.count} Unfulfilled Orders</strong>
      </div>
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        {data.orders.slice(0, 3).map(order => {
          const Tag = order.url ? 'a' : 'div'
          const linkProps = order.url ? { href: order.url, target: '_blank', rel: 'noopener noreferrer' } : {}
          return (
          <Tag key={order.id} {...linkProps} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '0.375rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.75rem', gap: '0.25rem', textDecoration: 'none', cursor: order.url ? 'pointer' : 'default', transition: 'background 0.15s' }}
            onMouseEnter={order.url ? (e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)' } : undefined}
            onMouseLeave={order.url ? (e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.2)' } : undefined}
          >
            <span style={{ color: 'white', minWidth: '0', wordBreak: 'break-word' }}><strong>#{order.id}</strong> - {order.name}</span>
            <span style={{ color: 'white', fontWeight: '600', flexShrink: 0 }}>{order.total} {order.url && '↗'}</span>
          </Tag>
          )
        })}
      </div>
    </div>
  )
}

// Weekly Workflow (placeholder)
export function WeeklyWorkflow() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().getDay()
  // Convert JS day (0=Sun) to our array index (0=Mon)
  const todayIndex = today === 0 ? 6 : today - 1

  return (
    <div style={{ border: '1.5px dashed #4b5563', borderRadius: '8px', padding: '1rem', marginTop: '0.75rem', position: 'relative' }}>
      <div className="workflow-grid" style={{ display: 'grid' }}>
        {days.map((day, i) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              padding: '0.5rem 0.25rem',
              background: i === todayIndex ? '#374151' : '#1f2937',
              borderRadius: '6px',
              border: i === todayIndex ? '1px solid #6b7280' : '1px solid transparent'
            }}
          >
            <div style={{ fontSize: '0.625rem', color: i === todayIndex ? 'white' : '#9ca3af', fontWeight: i === todayIndex ? '600' : '400' }}>{day}</div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === todayIndex ? '#60a5fa' : '#374151', margin: '0.375rem auto 0' }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.75rem', color: '#6b7280', fontSize: '0.6875rem', fontStyle: 'italic' }}>
        Coming soon — weekly workflow tracking
      </div>
    </div>
  )
}

// Media + Research (AI-powered insights from ContentVault + DataVault)
const MEDIA_FALLBACK_ENDPOINTS = {
  content: '/api/contentvault',
  data: '/api/datavault'
} as const

interface MediaData extends Record<string, unknown> {
  content: ContentVaultData
  data: DataVaultData
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green
  if (score >= 50) return '#eab308' // yellow
  return '#4b5563'                  // gray
}

// AI-powered view
function MediaInsightsView({ data }: { data: MediaInsightsResponse }) {
  const hasAI = data.items.some(i => i.summary)
  const time = new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        {data.items.map(item => {
          const Wrapper = item.url ? 'a' : 'div'
          const linkProps = item.url ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {}
          return (
          <Wrapper
            key={item.id}
            {...linkProps}
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.5rem',
              background: '#1f2937',
              borderRadius: '6px',
              fontSize: '0.75rem',
              borderLeft: hasAI ? `3px solid ${getScoreColor(item.relevanceScore)}` : undefined,
              textDecoration: 'none',
              cursor: item.url ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={item.url ? (e: any) => { e.currentTarget.style.background = '#283344' } : undefined}
            onMouseLeave={item.url ? (e: any) => { e.currentTarget.style.background = '#1f2937' } : undefined}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.125rem 0.375rem',
                  background: item.vault === 'CV' ? '#7c3aed' : '#2563eb',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.5625rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {item.vault}
                </span>
                <span style={{ color: 'white', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
                {item.url && (
                  <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>↗</span>
                )}
                {item.lastEdited && (
                  <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>
                    {new Date(item.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              {item.summary && (
                <div className="media-insight-sub" style={{ color: '#9ca3af', fontSize: '0.6875rem', lineHeight: '1.3' }}>
                  {item.summary}
                </div>
              )}
              {item.relevanceReason && (
                <div className="media-insight-sub" style={{ color: '#6b7280', fontSize: '0.625rem', fontStyle: 'italic' }}>
                  {item.relevanceReason}
                </div>
              )}
            </div>
          </Wrapper>
          )
        })}
      </div>
      {hasAI && (
        <div style={{ textAlign: 'right', marginTop: '0.375rem', color: '#4b5563', fontSize: '0.5625rem' }}>
          AI insights{data.cached ? ' (cached)' : ''} — {time}
        </div>
      )}
    </div>
  )
}

// Classic fallback view (no AI)
function MediaFallbackView() {
  const { data, loading, errors } = useMultipleNotionData<MediaData>(MEDIA_FALLBACK_ENDPOINTS)

  if (loading) return <LoadingState type="skeleton" count={3} />

  const hasError = Object.values(errors).some(e => e !== null)
  if (hasError && !data) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', marginTop: '0.75rem', fontSize: '0.75rem' }}>
        Unable to load media data
      </div>
    )
  }

  if (!data) return null

  type MergedItem = { id: string; title: string; vault: 'CV' | 'DV'; lastEdited: string; url?: string }
  const merged: MergedItem[] = []

  if (data.content?.items) {
    data.content.items.forEach(item => {
      merged.push({ id: item.id, title: item.title, vault: 'CV', lastEdited: item.lastEdited || '', url: item.url })
    })
  }
  if (data.data?.items) {
    data.data.items.forEach(item => {
      merged.push({ id: item.id, title: item.title, vault: 'DV', lastEdited: item.lastEdited || '', url: item.url })
    })
  }

  const top3 = merged
    .filter(i => i.lastEdited)
    .sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime())
    .slice(0, 3)

  if (!top3.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', marginTop: '0.75rem', fontSize: '0.75rem' }}>
        No recent media or research items
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.25rem' }}>
      {top3.map(item => {
        const Tag = item.url ? 'a' : 'div'
        const linkProps = item.url ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {}
        return (
        <Tag key={item.id} {...linkProps} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', cursor: item.url ? 'pointer' : 'default', transition: 'background 0.15s' }}
          onMouseEnter={item.url ? (e: any) => { e.currentTarget.style.background = '#283344' } : undefined}
          onMouseLeave={item.url ? (e: any) => { e.currentTarget.style.background = '#1f2937' } : undefined}
        >
          <span style={{
            padding: '0.125rem 0.375rem',
            background: item.vault === 'CV' ? '#7c3aed' : '#2563eb',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.5625rem',
            fontWeight: '600',
            flexShrink: 0
          }}>
            {item.vault}
          </span>
          <span style={{ color: 'white', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </span>
          {item.url && <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>↗</span>}
          <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>
            {new Date(item.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </Tag>
        )
      })}
    </div>
  )
}

export function MediaAndResearch() {
  const { data, loading, error } = useNotionData<MediaInsightsResponse>('/api/ai/media-insights')

  // AI loading
  if (loading) return <LoadingState type="skeleton" count={3} />

  // AI success with items
  if (data && data.items && data.items.length > 0) {
    return <MediaInsightsView data={data} />
  }

  // AI failed or empty → fallback to classic view
  return <MediaFallbackView />
}

// Goals & Metrics (renamed from TaoQuickStats)
export function GoalsAndMetrics() {
  const { data, loading, error, refetch } = useNotionData<DashboardData>('/api/dashboard')

  if (loading) return <LoadingState type="metrics" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const tao = data.taoStatus

  const metricStyle = {
    textAlign: 'center' as const,
    padding: '0.5rem',
    background: '#374151',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'block',
    cursor: 'pointer',
    transition: 'background 0.15s',
  }

  return (
    <div className="goals-grid" style={{ display: 'grid', marginTop: '0.75rem' }}>
      {[
        { value: tao.goals.amazonSales, label: 'Amazon Sales' },
        { value: tao.goals.amazonComReviews + tao.goals.amazonCaReviews, label: 'Amazon Reviews' },
        { value: tao.goals.subscribers.toLocaleString(), label: 'Subscribers' },
        { value: tao.metrics.shopifySales, label: 'Shopify Revenue' },
      ].map(m => (
        <a
          key={m.label}
          href="https://tao-promotion.vercel.app/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          style={metricStyle}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = '#4b5563' }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = '#374151' }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{m.value}</div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>{m.label}</div>
        </a>
      ))}
    </div>
  )
}

// Actions / To Do (GitHub Project Board)
interface ProjectItem {
  title: string
  status: string
  number: number
  url: string
}

interface GitHubProjectData {
  grouped: Record<string, ProjectItem[]>
  counts: Record<string, number>
  total: number
  projectUrl: string
}

const STATUS_CONFIG: Array<{ key: string; label: string; color: string }> = [
  { key: 'Up next', label: 'Up Next', color: '#eab308' },
  { key: 'In progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'For Review', label: 'For Review', color: '#a855f7' },
]

export function ActionsToDo() {
  const { data, loading, error, refetch } = useNotionData<GitHubProjectData>('/api/github/issues')
  const [expanded, setExpanded] = useState<string | null>(null)

  if (loading) return <LoadingState type="skeleton" count={3} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div className="actions-grid" style={{ display: 'grid' }}>
        {STATUS_CONFIG.map(({ key, label, color }) => {
          const count = data.counts[key] || 0
          const isExpanded = expanded === key
          return (
            <div
              key={key}
              onClick={() => setExpanded(isExpanded ? null : key)}
              style={{
                textAlign: 'center',
                padding: '0.5rem',
                background: isExpanded ? '#283344' : '#374151',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                borderBottom: `3px solid ${color}`,
              }}
              onMouseEnter={(e: any) => { if (!isExpanded) e.currentTarget.style.background = '#4b5563' }}
              onMouseLeave={(e: any) => { if (!isExpanded) e.currentTarget.style.background = '#374151' }}
            >
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{count}</div>
              <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>{label}</div>
            </div>
          )
        })}
      </div>

      {expanded && data.grouped[expanded] && (
        <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.25rem' }}>
          {data.grouped[expanded].map(item => (
            <a
              key={item.number}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#1f2937',
                borderRadius: '6px',
                fontSize: '0.75rem',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
                borderLeft: `3px solid ${STATUS_CONFIG.find(s => s.key === expanded)?.color || '#6b7280'}`,
              }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = '#283344' }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = '#1f2937' }}
            >
              <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>#{item.number}</span>
              <span style={{ color: 'white', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
              <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>↗</span>
            </a>
          ))}
        </div>
      )}

      <a
        href={data.projectUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textAlign: 'center', marginTop: '0.375rem', color: '#4b5563', fontSize: '0.5625rem', textDecoration: 'none', transition: 'color 0.15s' }}
        onMouseEnter={(e: any) => { e.currentTarget.style.color = 'white' }}
        onMouseLeave={(e: any) => { e.currentTarget.style.color = '#4b5563' }}
      >
        View project board ↗
      </a>
    </div>
  )
}

// Digest Feed (live cross-vault activity)
function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const SOURCE_BADGE_COLORS: Record<string, string> = {
  CV: '#7c3aed',
  DV: '#2563eb',
  TP: '#f59e0b',
  GH: '#9ca3af',
}

export function DigestFeed() {
  const { data, loading, error, refetch } = useNotionData<DigestResponse>('/api/digest')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div style={{ marginTop: '0.75rem' }}>
        <LoadingState type="skeleton" count={4} />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.items.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', marginTop: '0.75rem', fontSize: '0.75rem' }}>
        No recent activity across vaults
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.75rem', position: 'relative' }}>
      <div className="digest-timeline-line" style={{ position: 'absolute', top: '0', bottom: '0', width: '1.5px', background: '#374151' }} />
      <div className="digest-timeline" style={{ display: 'grid', gap: '0.5rem' }}>
        {data.items.map(item => {
          const dotColor = item.color || '#4b5563'
          const badgeColor = SOURCE_BADGE_COLORS[item.icon] || '#374151'
          const isExpanded = expandedId === item.id
          const hasDetails = Array.isArray(item.details) && item.details.length > 0
          return (
            <div
              key={item.id}
              onClick={hasDetails ? () => setExpandedId(isExpanded ? null : item.id) : undefined}
              style={{
                position: 'relative',
                padding: '0.5rem',
                background: isExpanded ? '#283344' : '#1f2937',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: hasDetails ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={hasDetails ? (e: any) => { if (!isExpanded) e.currentTarget.style.background = '#283344' } : undefined}
              onMouseLeave={hasDetails ? (e: any) => { if (!isExpanded) e.currentTarget.style.background = '#1f2937' } : undefined}
            >
              <div className="digest-dot" style={{ position: 'absolute', top: '0.75rem', width: '8px', height: '8px', borderRadius: '50%', background: dotColor, border: `1.5px solid ${dotColor}` }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {hasDetails && (
                  <span style={{
                    color: isExpanded ? '#d1d5db' : '#6b7280',
                    fontSize: '0.625rem',
                    flexShrink: 0,
                    width: '0.75rem',
                    textAlign: 'center' as const,
                    transition: 'color 0.15s',
                  }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                )}
                <span style={{
                  padding: '0.0625rem 0.25rem',
                  background: badgeColor,
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '0.5625rem',
                  fontWeight: '600',
                  flexShrink: 0,
                }}>{item.icon}</span>
                <span style={{
                  color: 'white',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.text}
                </span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '4px',
                      background: '#374151',
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      flexShrink: 0,
                      textDecoration: 'none',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = '#4b5563'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = '#374151'; e.currentTarget.style.color = '#9ca3af' }}
                  >↗</a>
                )}
                <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>
                  {relativeTime(item.timestamp)}
                </span>
              </div>
              {isExpanded && item.details && (
                <div className="digest-details" style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  borderLeft: `2px solid ${item.color || '#4b5563'}`,
                }}>
                  {(Array.isArray(item.details) ? item.details : []).map((d: DigestDetail, i: number) => (
                    <div key={i} style={{ marginTop: i > 0 ? '0.375rem' : 0 }}>
                      <div style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '0.125rem' }}>{d.label}</div>
                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.6875rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.cached && (
        <div style={{ textAlign: 'right', marginTop: '0.375rem', color: '#4b5563', fontSize: '0.5625rem' }}>
          cached
        </div>
      )}
    </div>
  )
}
