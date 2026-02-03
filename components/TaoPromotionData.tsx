import React from 'react'
import { useNotionData } from '../hooks/useNotionData'
import { LoadingState, ErrorState } from './LoadingState'
import { VaultLink } from './VaultLink'

interface TaoOrder {
  id: string
  name: string
  total: string
  date: string
}

interface TaoTask {
  title: string
  priority: string
  due: string
}

interface TaoStatusData {
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

interface OrdersData {
  orders: TaoOrder[]
  count: number
}

interface TasksData {
  tasks: TaoTask[]
  count: number
}

interface FeedbackData {
  reviews: Array<{ id: string; title: string; userName?: string }>
  count: number
}

// Combined Goals & Metrics display component
export function TaoGoalsAndMetrics() {
  const { data, loading, error, refetch } = useNotionData<TaoStatusData>('/api/tao/status')

  if (loading) return <LoadingState type="skeleton" count={8} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Unfulfilled Orders</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.metrics.unfulfilled}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Amazon Sales (Total)</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.amazonSales}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Shopify Revenue</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.metrics.shopifySales}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Substack Subscribers</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.subscribers.toLocaleString()}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Amazon.com Reviews</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.amazonComReviews}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Amazon.ca Reviews</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.amazonCaReviews}</div>
      </div>
    </div>
  )
}

// Legacy metrics component (kept for backwards compatibility)
export function TaoMetrics() {
  return <TaoGoalsAndMetrics />
}

// Unfulfilled orders table
export function TaoUnfulfilledOrders() {
  const { data, loading, error, refetch } = useNotionData<OrdersData>('/api/tao/orders?filter=unfulfilled')

  if (loading) return <LoadingState type="skeleton" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.orders.length) {
    return (
      <div style={{ padding: '0.75rem', background: '#1f2937', borderRadius: '6px', textAlign: 'center', color: 'white', fontSize: '0.75rem' }}>
        All orders fulfilled!
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '0.5rem', background: '#1f2937', borderRadius: '6px', padding: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '300px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            <th style={{ padding: '0.375rem', textAlign: 'left', color: '#9ca3af' }}>Order</th>
            <th style={{ padding: '0.375rem', textAlign: 'left', color: '#9ca3af' }}>Customer</th>
            <th style={{ padding: '0.375rem', textAlign: 'right', color: '#9ca3af' }}>Amount</th>
            <th style={{ padding: '0.375rem', textAlign: 'right', color: '#9ca3af' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.orders.map((order) => (
            <tr key={order.id} style={{ borderBottom: '1px solid #374151' }}>
              <td style={{ padding: '0.375rem', fontWeight: '600', color: 'white' }}>#{order.id}</td>
              <td style={{ padding: '0.375rem', color: 'white' }}>{order.name}</td>
              <td style={{ padding: '0.375rem', textAlign: 'right', color: 'white', fontWeight: '600' }}>{order.total}</td>
              <td style={{ padding: '0.375rem', textAlign: 'right', color: '#9ca3af' }}>{order.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Pending tasks list
export function TaoPendingTasks() {
  const { data, loading, error, refetch } = useNotionData<TasksData>('/api/tao/tasks?status=To Do')

  if (loading) return <LoadingState type="skeleton" count={2} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.tasks.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: 'white', fontSize: '0.75rem' }}>
        No pending tasks
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
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

// Goals display
export function TaoGoals() {
  const { data, loading, error, refetch } = useNotionData<TaoStatusData>('/api/tao/status')

  if (loading) return <LoadingState type="skeleton" count={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Amazon Sales (Total)</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.amazonSales}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Substack Subscribers</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.subscribers.toLocaleString()}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Amazon.com Reviews</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.amazonComReviews}</div>
      </div>
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.625rem' }}>Amazon.ca Reviews</div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{data.goals.amazonCaReviews}</div>
      </div>
    </div>
  )
}

// Recent reviews list (last 3 months only)
export function TaoRecentReviews() {
  const { data, loading, error, refetch } = useNotionData<FeedbackData>('/api/tao/feedback?limit=5&recent=true')

  if (loading) return <LoadingState type="skeleton" count={3} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || !data.reviews.length) {
    return (
      <div style={{ padding: '0.5rem', background: '#1f2937', borderRadius: '6px', color: '#9ca3af', fontSize: '0.75rem' }}>
        No reviews yet
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {data.reviews.map((review) => (
        <div key={review.id} style={{ padding: '0.375rem 0.5rem', background: '#1f2937', borderLeft: '2px solid #6b7280', marginBottom: '0.25rem', borderRadius: '0 6px 6px 0', fontSize: '0.75rem' }}>
          <span style={{ color: 'white' }}>{review.title}</span>
          {review.userName && <span style={{ color: '#9ca3af', marginLeft: '0.375rem' }}>by {review.userName}</span>}
        </div>
      ))}
    </div>
  )
}

// Header with link
export function TaoHeader() {
  return <VaultLink url="https://tao-promotion.vercel.app/dashboard" name="Tao Promotion Dashboard" />
}

// Last updated timestamp
export function TaoLastUpdated() {
  return (
    <div style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.625rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  )
}
