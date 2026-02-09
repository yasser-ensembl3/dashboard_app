import React from 'react'
import { useNotionData, useMultipleNotionData } from '../hooks/useNotionData'
import { LoadingState, ErrorState } from './LoadingState'
import type { ContentVaultData, DataVaultData } from '../lib/types'

interface OrdersData {
  orders: Array<{
    id: string
    name: string
    total: string
    date: string
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
        {data.orders.slice(0, 3).map(order => (
          <div key={order.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '0.375rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.75rem', gap: '0.25rem' }}>
            <span style={{ color: 'white', minWidth: '0', wordBreak: 'break-word' }}><strong>#{order.id}</strong> - {order.name}</span>
            <span style={{ color: 'white', fontWeight: '600', flexShrink: 0 }}>{order.total}</span>
          </div>
        ))}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.375rem' }}>
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

// Media + Research (live data from ContentVault + DataVault)
const MEDIA_ENDPOINTS = {
  content: '/api/contentvault',
  data: '/api/datavault'
} as const

interface MediaData extends Record<string, unknown> {
  content: ContentVaultData
  data: DataVaultData
}

export function MediaAndResearch() {
  const { data, loading, errors } = useMultipleNotionData<MediaData>(MEDIA_ENDPOINTS)

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

  // Merge items from both vaults with vault badge
  type MergedItem = { id: string; title: string; vault: 'CV' | 'DV'; lastEdited: string; url?: string }
  const merged: MergedItem[] = []

  if (data.content?.items) {
    data.content.items.forEach(item => {
      merged.push({
        id: item.id,
        title: item.title,
        vault: 'CV',
        lastEdited: item.lastEdited || '',
        url: item.url
      })
    })
  }

  if (data.data?.items) {
    data.data.items.forEach(item => {
      merged.push({
        id: item.id,
        title: item.title,
        vault: 'DV',
        lastEdited: item.lastEdited || '',
        url: item.url
      })
    })
  }

  // Sort by lastEdited descending, take top 3
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
      {top3.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', fontSize: '0.75rem' }}>
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
          <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>
            {new Date(item.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  )
}

// Goals & Metrics (renamed from TaoQuickStats)
export function GoalsAndMetrics() {
  const { data, loading, error, refetch } = useNotionData<DashboardData>('/api/dashboard')

  if (loading) return <LoadingState type="metrics" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const tao = data.taoStatus

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
      <div style={{ textAlign: 'center', padding: '0.5rem', background: '#374151', borderRadius: '6px' }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{tao.goals.amazonSales}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Amazon Sales</div>
      </div>
      <div style={{ textAlign: 'center', padding: '0.5rem', background: '#374151', borderRadius: '6px' }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{tao.goals.amazonComReviews + tao.goals.amazonCaReviews}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Amazon Reviews</div>
      </div>
      <div style={{ textAlign: 'center', padding: '0.5rem', background: '#374151', borderRadius: '6px' }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{tao.goals.subscribers.toLocaleString()}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Subscribers</div>
      </div>
      <div style={{ textAlign: 'center', padding: '0.5rem', background: '#374151', borderRadius: '6px' }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{tao.metrics.shopifySales}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Shopify Revenue</div>
      </div>
    </div>
  )
}

// Actions / To Do (renamed from DashboardPendingTasks)
export function ActionsToDo() {
  const { data, loading, error, refetch } = useNotionData<TasksData>('/api/tao/tasks?status=To Do')

  if (loading) return <LoadingState type="skeleton" count={2} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.tasks.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: 'white', marginTop: '0.75rem', fontSize: '0.75rem' }}>
        No pending tasks
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {data.tasks.map(task => (
        <div key={task.title} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', marginBottom: '0.25rem', fontSize: '0.75rem', gap: '0.25rem' }}>
          <div style={{ color: 'white', flex: '1 1 auto', minWidth: '0' }}>
            <strong style={{ wordBreak: 'break-word' }}>{task.title}</strong>
            <span style={{ marginLeft: '0.375rem', padding: '0.125rem 0.375rem', background: '#4b5563', color: 'white', borderRadius: '4px', fontSize: '0.625rem' }}>{task.priority}</span>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.625rem', flexShrink: 0 }}>Due: {task.due}</div>
        </div>
      ))}
    </div>
  )
}

// Digest Feed (placeholder)
export function DigestFeed() {
  const mockItems = [
    { source: 'GitHub', icon: 'GH', text: 'Push to main — Dashboard MiniVault', time: '2h ago' },
    { source: 'Notion', icon: 'NT', text: 'Task completed: Update product descriptions', time: '5h ago' },
    { source: 'Obsidian', icon: 'OB', text: 'Note edited: Weekly review template', time: '1d ago' }
  ]

  return (
    <div style={{ marginTop: '0.75rem', position: 'relative', opacity: 0.5 }}>
      <div style={{ position: 'absolute', left: '8px', top: '0', bottom: '0', width: '1.5px', background: '#374151' }} />
      <div style={{ display: 'grid', gap: '0.5rem', paddingLeft: '1.5rem' }}>
        {mockItems.map((item, i) => (
          <div key={i} style={{ position: 'relative', padding: '0.5rem', background: '#1f2937', borderRadius: '6px', fontSize: '0.75rem' }}>
            <div style={{ position: 'absolute', left: '-1.25rem', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#4b5563', border: '1.5px solid #6b7280' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ padding: '0.0625rem 0.25rem', background: '#374151', color: '#9ca3af', borderRadius: '3px', fontSize: '0.5625rem', fontWeight: '600' }}>{item.icon}</span>
              <span style={{ color: 'white', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
              <span style={{ color: '#6b7280', fontSize: '0.625rem', flexShrink: 0 }}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.75rem', color: '#6b7280', fontSize: '0.6875rem', fontStyle: 'italic' }}>
        Coming soon — cross-vault activity digest
      </div>
    </div>
  )
}
