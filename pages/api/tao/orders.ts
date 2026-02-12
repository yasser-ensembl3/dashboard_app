import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, getTitle, getRichText, getNumber, getSelect, getDate, formatDate } from '../../../lib/notion'
import type { TaoOrder } from '../../../lib/types'

// Tao Promotion Orders Database ID
const TAO_ORDERS_DB = process.env.NOTION_TAO_ORDERS_DB || ''

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

    const { filter } = req.query
    const showUnfulfilledOnly = filter === 'unfulfilled'

    // If no database ID configured, return error
    if (!TAO_ORDERS_DB) {
      return res.status(503).json({ error: 'NOTION_TAO_ORDERS_DB not configured' })
    }

    // Query Notion database
    const filter_conditions: any = showUnfulfilledOnly ? {
      property: 'Fulfillment',
      select: {
        equals: 'Unfulfilled'
      }
    } : undefined

    const response = await queryDatabase({
      database_id: TAO_ORDERS_DB,
      filter: filter_conditions,
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ],
      page_size: 50
    })

    const orders: TaoOrder[] = response.results.map((page: any) => {
      const props = page.properties
      // Total field is named "Total $"
      const totalValue = getNumber(props['Total $']) || 0
      return {
        id: getTitle(props.Order) || page.id.slice(0, 8),
        name: getRichText(props.Customer) || getRichText(props.Name) || 'Unknown',
        total: `$${totalValue}`,
        date: formatDate(getDate(props.Date)),
        payment: getSelect(props.Payment) || 'Unknown',
        fulfillment: getSelect(props.Fulfillment) || 'Unknown',
        url: `https://notion.so/${page.id.replace(/-/g, '')}`
      }
    })

    return res.status(200).json({
      orders,
      count: orders.length,
      source: 'notion'
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return res.status(500).json({ error: 'Failed to fetch orders' })
  }
}
