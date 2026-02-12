import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, DATABASES, getTitle, getRichText, getDate, getUrl } from '../../lib/notion'
import type { DataVaultData, DataItem } from '../../lib/types'

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
    if (!DATABASES.DATAVAULT) {
      return res.status(503).json({ error: 'NOTION_DATAVAULT_DB not configured' })
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
        title: getTitle(props.Title) || 'Untitled',
        authors: getRichText(props.Authors) || '',
        subject: getRichText(props.Subject) || '',
        description: getRichText(props.Description) || '',
        submission: getDate(props.Submission) || undefined,
        url: getUrl(props['pdf Link']) || undefined,
        lastEdited: page.last_edited_time
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

    return res.status(500).json({ error: 'Failed to fetch DataVault data' })
  }
}
