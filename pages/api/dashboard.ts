import type { NextApiRequest, NextApiResponse } from 'next'

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000')

    // Fetch data from all API endpoints in parallel
    const [taoStatusRes, contentVaultRes, dataVaultRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/tao/status`),
      fetch(`${baseUrl}/api/contentvault`),
      fetch(`${baseUrl}/api/datavault`)
    ])

    // Parse responses with fallbacks
    let taoStatus = {
      metrics: {
        unfulfilled: 4,
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

    let contentVault = {
      metrics: {
        totalItems: 19,
        toRead: 18,
        inbox: 1
      }
    }

    let dataVault = {
      metrics: {
        totalItems: 0
      }
    }

    if (taoStatusRes.status === 'fulfilled' && taoStatusRes.value.ok) {
      taoStatus = await taoStatusRes.value.json()
    }

    if (contentVaultRes.status === 'fulfilled' && contentVaultRes.value.ok) {
      const cvData = await contentVaultRes.value.json()
      contentVault = { metrics: cvData.metrics }
    }

    if (dataVaultRes.status === 'fulfilled' && dataVaultRes.value.ok) {
      const dvData = await dataVaultRes.value.json()
      dataVault = { metrics: dvData.metrics }
    }

    // Build the vaults object
    const vaults = {
      datavault: {
        ...staticVaults.datavault,
        metrics: dataVault.metrics
      },
      contentvault: {
        name: 'ContentVault',
        url: 'https://media-minivault.vercel.app/vault',
        description: 'Content consumption tracker - podcasts, articles, videos.',
        icon: '',
        metrics: contentVault.metrics
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
