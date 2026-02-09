import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, DATABASES, getTitle, getSelect, getUrl } from '../../lib/notion'

const TAO_ORDERS_DB = process.env.NOTION_TAO_ORDERS_DB || ''
const TAO_GOALS_DB = process.env.NOTION_TAO_GOALS_DB || ''

// Helper to get the most recent value for a metric
function getLatestMetric(goals: any[], metricName: string): number {
  const matches = goals.filter(g => {
    const name = g.properties['Metric Name']?.title?.[0]?.plain_text || ''
    return name.toLowerCase().includes(metricName.toLowerCase())
  })

  if (matches.length === 0) return 0

  matches.sort((a, b) => {
    const dateA = a.properties['Last Updated']?.date?.start || ''
    const dateB = b.properties['Last Updated']?.date?.start || ''
    return dateB.localeCompare(dateA)
  })

  return matches[0].properties.Number?.number || 0
}

// Static data for vaults that don't have Notion integration
const staticVaults = {
  datavault: {
    name: 'DataVault',
    url: 'https://datavault-rust.vercel.app/vault',
    description: 'Research results database - currently empty, ready for new entries.',
    icon: '',
    status: 'empty'
  },
  stockvault: {
    name: 'StockVault',
    url: 'https://stock-vault.vercel.app/dashboard',
    description: 'Quarterly financial analysis and investment reports.',
    icon: '',
    metrics: {
      stockCompanies: 12,
      investmentCompanies: 21,
      quarters: 3
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Cache: 5 min CDN, serve stale up to 10 min while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    // Fetch all Notion data directly in parallel (no self-fetch)
    const [taoOrdersRes, taoGoalsRes, contentVaultRes, dataVaultRes] = await Promise.allSettled([
      TAO_ORDERS_DB ? queryDatabase({ database_id: TAO_ORDERS_DB, page_size: 100 }) : Promise.resolve(null),
      TAO_GOALS_DB ? queryDatabase({ database_id: TAO_GOALS_DB, page_size: 100 }) : Promise.resolve(null),
      DATABASES.CONTENTVAULT ? queryDatabase({ database_id: DATABASES.CONTENTVAULT, page_size: 100 }) : Promise.resolve(null),
      DATABASES.DATAVAULT ? queryDatabase({ database_id: DATABASES.DATAVAULT, page_size: 100 }) : Promise.resolve(null),
    ])

    // --- Tao Status ---
    let unfulfilledCount = 0
    let totalRevenue = 0
    let amazonSales = 0
    let amazonComReviews = 0
    let amazonCaReviews = 0
    let subscribers = 0

    if (taoOrdersRes.status === 'fulfilled' && taoOrdersRes.value) {
      taoOrdersRes.value.results.forEach((page: any) => {
        const props = page.properties
        const fulfillment = props.Fulfillment?.select?.name || ''
        const total = props['Total $']?.number || 0
        if (fulfillment === 'Unfulfilled') unfulfilledCount++
        totalRevenue += total
      })
    }

    if (taoGoalsRes.status === 'fulfilled' && taoGoalsRes.value) {
      const goals = taoGoalsRes.value.results
      const latestSales = getLatestMetric(goals, 'number of sales')
      const latestComReviews = getLatestMetric(goals, 'amazoncom reviews')
      const latestCaReviews = getLatestMetric(goals, 'amazonca reviews')
      const latestSubscribers = getLatestMetric(goals, 'number of subscribers')
      if (latestSales > 0) amazonSales = latestSales
      if (latestComReviews > 0) amazonComReviews = latestComReviews
      if (latestCaReviews > 0) amazonCaReviews = latestCaReviews
      if (latestSubscribers > 0) subscribers = latestSubscribers
    }

    const taoStatus = {
      metrics: {
        unfulfilled: unfulfilledCount,
        amazonSales,
        amazonReviews: amazonComReviews + amazonCaReviews,
        shopifySales: `$${totalRevenue.toFixed(0)}`
      },
      goals: {
        amazonSales,
        amazonComReviews,
        amazonCaReviews,
        subscribers
      }
    }

    // --- ContentVault ---
    let contentVaultMetrics = { totalItems: 0, toRead: 0, inbox: 0 }
    if (contentVaultRes.status === 'fulfilled' && contentVaultRes.value) {
      const items = contentVaultRes.value.results.map((page: any) => ({
        status: getSelect(page.properties.Status) || 'Unknown'
      }))
      contentVaultMetrics = {
        totalItems: items.length,
        toRead: items.filter((i: any) => i.status === 'To Read').length,
        inbox: items.filter((i: any) => i.status === 'Inbox').length
      }
    }

    // --- DataVault ---
    let dataVaultMetrics = { totalItems: 0 }
    if (dataVaultRes.status === 'fulfilled' && dataVaultRes.value) {
      dataVaultMetrics = { totalItems: dataVaultRes.value.results.length }
    }

    // Build the vaults object
    const vaults = {
      datavault: {
        ...staticVaults.datavault,
        metrics: dataVaultMetrics
      },
      contentvault: {
        name: 'ContentVault',
        url: 'https://media-minivault.vercel.app/vault',
        description: 'Content consumption tracker - podcasts, articles, videos.',
        icon: '',
        metrics: contentVaultMetrics
      },
      stockvault: staticVaults.stockvault,
      'tao-promotion': {
        name: 'Tao Promotion',
        url: 'https://tao-promotion.vercel.app/dashboard',
        description: 'Sales tracking and promotion for the Tao of Founders book.',
        icon: '',
        metrics: taoStatus.metrics,
        goals: taoStatus.goals
      }
    }

    return res.status(200).json({
      lastUpdated: new Date().toISOString(),
      vaults,
      taoStatus
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
}
