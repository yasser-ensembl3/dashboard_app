import React from 'react'
import { useNotionData } from '../hooks/useNotionData'
import { LoadingState, ErrorState } from './LoadingState'
import { VaultCard } from './VaultCard'

interface VaultMetrics {
  [key: string]: number | string
}

interface VaultInfo {
  name: string
  url: string
  description: string
  icon: string
  metrics: VaultMetrics
}

interface TaoStatus {
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

interface DashboardData {
  lastUpdated: string
  vaults: {
    datavault: VaultInfo
    contentvault: VaultInfo
    stockvault: VaultInfo
    'tao-promotion': VaultInfo & { goals: TaoStatus['goals'] }
  }
  taoStatus: TaoStatus
}

interface OrdersData {
  orders: Array<{
    id: string
    name: string
    total: string
    date: string
  }>
  count: number
}

interface TasksData {
  tasks: Array<{
    title: string
    priority: string
    due: string
  }>
}

interface FeedbackData {
  reviews: Array<{
    id: string
    title: string
    userName?: string
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

// Vault Cards Grid
export function VaultCardsGrid() {
  const { data, loading, error, refetch } = useNotionData<DashboardData>('/api/dashboard')

  if (loading) return <LoadingState type="card" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  return (
    <div className="vault-cards-grid" style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
      {Object.entries(data.vaults).map(([key, vault]) => (
        <VaultCard
          key={key}
          name={vault.name}
          description={vault.description}
          url={vault.url}
          metrics={vault.metrics}
          icon={vault.icon}
        />
      ))}
    </div>
  )
}

// Tao Quick Stats
export function TaoQuickStats() {
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

// Pending Tasks
export function DashboardPendingTasks() {
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

// Recent Reviews (last 3 months only)
export function DashboardRecentReviews() {
  const { data, loading, error, refetch } = useNotionData<FeedbackData>('/api/tao/feedback?limit=5&recent=true')

  if (loading) return <LoadingState type="skeleton" count={3} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.reviews.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', marginTop: '0.75rem', fontSize: '0.75rem' }}>
        No reviews yet
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.25rem' }}>
      {data.reviews.map((review) => (
        <div key={review.id} style={{ padding: '0.375rem 0.5rem', background: '#1f2937', borderLeft: '2px solid #6b7280', borderRadius: '0 6px 6px 0', fontSize: '0.75rem' }}>
          <span style={{ color: 'white' }}>{review.title}</span>
          {review.userName && <span style={{ color: '#9ca3af', marginLeft: '0.375rem' }}>by {review.userName}</span>}
        </div>
      ))}
    </div>
  )
}

// Last Updated
export function DashboardLastUpdated() {
  return (
    <div style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.625rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  )
}
