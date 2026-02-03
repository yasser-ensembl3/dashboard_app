import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, DATABASES, getTitle, getSelect, getUrl } from '../../lib/notion'
import type { DataVaultData, DataItem } from '../../lib/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // If no database ID configured, return fallback
    if (!DATABASES.DATAVAULT) {
      const fallbackData: DataVaultData = {
        metrics: {
          totalItems: 0
        },
        status: 'empty',
        items: []
      }

      return res.status(200).json({
        ...fallbackData,
        source: 'fallback'
      })
    }

    // Query Notion database
    const response = await queryDatabase({
      database_id: DATABASES.DATAVAULT,
      page_size: 100
    })

    // Process items
    const items: DataItem[] = response.results.map((page: any) => {
      const props = page.properties
      return {
        id: page.id,
        title: getTitle(props.Title) || getTitle(props.Name) || 'Untitled',
        category: getSelect(props.Category) || getSelect(props.Type) || 'Unknown',
        status: getSelect(props.Status) || 'Unknown',
        url: getUrl(props.URL) || undefined
      }
    })

    // Calculate metrics
    const totalItems = items.length
    const status = totalItems === 0 ? 'empty' : 'active'

    const data: DataVaultData = {
      metrics: {
        totalItems
      },
      status,
      items
    }

    return res.status(200).json({
      ...data,
      source: 'notion'
    })
  } catch (error) {
    console.error('Error fetching DataVault data:', error)

    // Return fallback on error
    const fallbackData: DataVaultData = {
      metrics: {
        totalItems: 0
      },
      status: 'empty',
      items: []
    }

    return res.status(200).json({
      ...fallbackData,
      source: 'fallback',
      error: 'Failed to fetch from Notion'
    })
  }
}
