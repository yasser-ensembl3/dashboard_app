import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, DATABASES, getTitle, getSelect, getUrl, getFileUrl, getDate, getRichText } from '../../lib/notion'
import type { ContentVaultData, ContentItem } from '../../lib/types'

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

    // If no database ID configured, return error
    if (!DATABASES.CONTENTVAULT) {
      return res.status(503).json({ error: 'NOTION_CONTENTVAULT_DB not configured' })
    }

    // Query Notion database
    const response = await queryDatabase({
      database_id: DATABASES.CONTENTVAULT,
      page_size: 100
    })

    // Process items — columns: Link (title), type, Status, Date, Audio Link, Audio summary, Text summary, Transcript/pdf
    const items: ContentItem[] = response.results.map((page: any) => {
      const props = page.properties
      // Primary URL: Audio summary (files) > Audio Link (url) > Text summary (files)
      const url = getFileUrl(props['Audio summary'])
        || getUrl(props['Audio Link'])
        || getFileUrl(props['Text summary'])
        || undefined
      return {
        id: page.id,
        title: getTitle(props.Link) || getTitle(props.Title) || getTitle(props.Name) || 'Untitled',
        source: getSelect(props.type) || 'Unknown',
        type: getSelect(props.type) || 'Unknown',
        status: getSelect(props.Status) || 'Unknown',
        url,
        lastEdited: page.last_edited_time
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

    return res.status(500).json({ error: 'Failed to fetch ContentVault data' })
  }
}
