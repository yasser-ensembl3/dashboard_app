import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, getTitle, getNumber, getDate } from '../../../lib/notion'
import type { TaoStatus } from '../../../lib/types'

const TAO_ORDERS_DB = process.env.NOTION_TAO_ORDERS_DB || ''
const TAO_GOALS_DB = process.env.NOTION_TAO_GOALS_DB || ''

// Helper to get the most recent value for a metric
function getLatestMetric(goals: any[], metricName: string): number {
  const matches = goals.filter(g => {
    const name = g.properties['Metric Name']?.title?.[0]?.plain_text || ''
    return name.toLowerCase().includes(metricName.toLowerCase())
  })

  if (matches.length === 0) return 0

  // Sort by date descending and get the most recent
  matches.sort((a, b) => {
    const dateA = a.properties['Last Updated']?.date?.start || ''
    const dateB = b.properties['Last Updated']?.date?.start || ''
    return dateB.localeCompare(dateA)
  })

  return matches[0].properties.Number?.number || 0
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let unfulfilledCount = 0
    let totalRevenue = 0
    let amazonSales = 118
    let amazonComReviews = 53
    let amazonCaReviews = 44
    let subscribers = 5288

    // Query orders for unfulfilled count and revenue
    if (TAO_ORDERS_DB) {
      const ordersResponse = await queryDatabase({
        database_id: TAO_ORDERS_DB,
        page_size: 100
      })

      ordersResponse.results.forEach((page: any) => {
        const props = page.properties
        const fulfillment = props.Fulfillment?.select?.name || ''
        const total = props['Total $']?.number || 0

        if (fulfillment === 'Unfulfilled') {
          unfulfilledCount++
        }
        totalRevenue += total
      })
    }

    // Query goals for latest metrics
    if (TAO_GOALS_DB) {
      const goalsResponse = await queryDatabase({
        database_id: TAO_GOALS_DB,
        page_size: 100
      })

      const goals = goalsResponse.results

      // Get latest values for each metric
      const latestSales = getLatestMetric(goals, 'number of sales')
      const latestComReviews = getLatestMetric(goals, 'amazoncom reviews')
      const latestCaReviews = getLatestMetric(goals, 'amazonca reviews')
      const latestSubscribers = getLatestMetric(goals, 'number of subscribers')

      // Only update if we got valid values
      if (latestSales > 0) amazonSales = latestSales
      if (latestComReviews > 0) amazonComReviews = latestComReviews
      if (latestCaReviews > 0) amazonCaReviews = latestCaReviews
      if (latestSubscribers > 0) subscribers = latestSubscribers
    }

    const status: TaoStatus = {
      metrics: {
        unfulfilled: unfulfilledCount,
        amazonSales: amazonSales,
        amazonReviews: amazonComReviews + amazonCaReviews,
        shopifySales: `$${totalRevenue.toFixed(0)}`
      },
      goals: {
        amazonSales: amazonSales,
        amazonComReviews: amazonComReviews,
        amazonCaReviews: amazonCaReviews,
        subscribers: subscribers
      }
    }

    return res.status(200).json(status)
  } catch (error) {
    console.error('Error fetching status:', error)

    // Return fallback on error
    const fallbackStatus: TaoStatus = {
      metrics: {
        unfulfilled: 0,
        amazonSales: 118,
        amazonReviews: 97,
        shopifySales: '$292'
      },
      goals: {
        amazonSales: 118,
        amazonComReviews: 53,
        amazonCaReviews: 44,
        subscribers: 5288
      }
    }

    return res.status(200).json(fallbackStatus)
  }
}
