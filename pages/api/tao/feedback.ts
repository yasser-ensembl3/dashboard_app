import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, getTitle, getRichText, getAnyText } from '../../../lib/notion'
import type { TaoReview } from '../../../lib/types'

// Tao Promotion Feedback Database ID
const TAO_FEEDBACK_DB = process.env.NOTION_TAO_FEEDBACK_DB || ''

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { limit, recent } = req.query
    const maxResults = limit ? parseInt(limit as string) : 10
    const filterRecent = recent === 'true' || recent === '1'

    // Calculate date 3 months ago
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoISO = threeMonthsAgo.toISOString()

    // If no database ID configured, return fallback
    if (!TAO_FEEDBACK_DB) {
      const fallbackReviews: TaoReview[] = [
        { id: '1', title: 'Great book', content: '', userName: 'John D.' },
        { id: '2', title: 'Toute une référence', content: '', userName: 'Marie L.' },
        { id: '3', title: 'Tao - great insights', content: '', userName: 'Alex M.' },
        { id: '4', title: 'Truly Inspiring Book', content: '', userName: 'Sarah K.' },
        { id: '5', title: 'Great gift for startup founders', content: '', userName: 'David R.' },
      ]

      return res.status(200).json({
        reviews: fallbackReviews.slice(0, maxResults),
        count: fallbackReviews.length,
        source: 'fallback'
      })
    }

    const queryParams: any = {
      database_id: TAO_FEEDBACK_DB,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending'
        }
      ],
      page_size: maxResults
    }

    // Add filter for recent reviews (last 3 months)
    if (filterRecent) {
      queryParams.filter = {
        timestamp: 'created_time',
        created_time: {
          on_or_after: threeMonthsAgoISO
        }
      }
    }

    const response = await queryDatabase(queryParams)

    const reviews: TaoReview[] = response.results.map((page: any) => {
      const props = page.properties
      // User Name is a rich_text field
      const userName = getRichText(props['User Name']) || ''
      return {
        id: page.id,
        title: getTitle(props.Title) || getTitle(props.Name) || 'Review',
        content: getRichText(props.Feedback) || getRichText(props.Content) || '',
        userName
      }
    })

    return res.status(200).json({
      reviews,
      count: reviews.length,
      source: 'notion'
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return res.status(500).json({ error: 'Failed to fetch feedback' })
  }
}
