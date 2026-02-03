import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, DATABASES, getTitle, getSelect, getUrl } from '../../lib/notion'
import type { ContentVaultData, ContentItem } from '../../lib/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // If no database ID configured, return fallback
    if (!DATABASES.CONTENTVAULT) {
      const fallbackData: ContentVaultData = {
        metrics: {
          totalItems: 19,
          toRead: 18,
          inbox: 1
        },
        bySource: [
          { source: 'Apple Podcasts', count: 7 },
          { source: 'Blog', count: 6 },
          { source: 'YouTube', count: 5 },
          { source: 'ArXiv', count: 1 }
        ],
        byType: [
          { type: 'Audio Summary', count: 18 },
          { type: 'Paper', count: 1 }
        ],
        items: []
      }

      return res.status(200).json({
        ...fallbackData,
        source: 'fallback'
      })
    }

    // Query Notion database
    const response = await queryDatabase({
      database_id: DATABASES.CONTENTVAULT,
      page_size: 100
    })

    // Process items
    const items: ContentItem[] = response.results.map((page: any) => {
      const props = page.properties
      return {
        id: page.id,
        title: getTitle(props.Title) || getTitle(props.Name) || 'Untitled',
        source: getSelect(props.Source) || 'Unknown',
        type: getSelect(props.Type) || 'Unknown',
        status: getSelect(props.Status) || 'Unknown',
        url: getUrl(props.URL) || undefined
      }
    })

    // Calculate metrics
    const totalItems = items.length
    const toRead = items.filter(i => i.status === 'To Read').length
    const inbox = items.filter(i => i.status === 'Inbox').length

    // Group by source
    const sourceMap = new Map<string, number>()
    items.forEach(item => {
      const current = sourceMap.get(item.source) || 0
      sourceMap.set(item.source, current + 1)
    })
    const bySource = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)

    // Group by type
    const typeMap = new Map<string, number>()
    items.forEach(item => {
      const current = typeMap.get(item.type) || 0
      typeMap.set(item.type, current + 1)
    })
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    const data: ContentVaultData = {
      metrics: {
        totalItems,
        toRead,
        inbox
      },
      bySource,
      byType,
      items
    }

    return res.status(200).json({
      ...data,
      source: 'notion'
    })
  } catch (error) {
    console.error('Error fetching ContentVault data:', error)

    // Return fallback on error
    const fallbackData: ContentVaultData = {
      metrics: {
        totalItems: 19,
        toRead: 18,
        inbox: 1
      },
      bySource: [
        { source: 'Apple Podcasts', count: 7 },
        { source: 'Blog', count: 6 },
        { source: 'YouTube', count: 5 },
        { source: 'ArXiv', count: 1 }
      ],
      byType: [
        { type: 'Audio Summary', count: 18 },
        { type: 'Paper', count: 1 }
      ],
      items: []
    }

    return res.status(200).json({
      ...fallbackData,
      source: 'fallback',
      error: 'Failed to fetch from Notion'
    })
  }
}
