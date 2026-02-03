import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, getTitle, getSelect, getDate } from '../../../lib/notion'
import type { TaoTask } from '../../../lib/types'

// Tao Promotion Tasks Database ID
const TAO_TASKS_DB = process.env.NOTION_TAO_TASKS_DB || ''

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { status } = req.query

    // If no database ID configured, return fallback
    if (!TAO_TASKS_DB) {
      const fallbackTasks: TaoTask[] = [
        {
          id: '1',
          title: 'Marketing plan + video Tao FR',
          status: 'To Do',
          priority: 'High',
          due: '2025-12-14'
        }
      ]

      const filtered = status && status !== 'all'
        ? fallbackTasks.filter(t => t.status === status)
        : fallbackTasks

      return res.status(200).json({
        tasks: filtered,
        count: filtered.length,
        source: 'fallback'
      })
    }

    // Fetch all tasks (filter in JavaScript since Status is rich_text, not select)
    const response = await queryDatabase({
      database_id: TAO_TASKS_DB,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending'
        }
      ],
      page_size: 50
    })

    let tasks: TaoTask[] = response.results.map((page: any) => {
      const props = page.properties

      // Handle multiple property types: status, select, or rich_text
      let statusValue = 'Unknown'
      if (props.Status?.status?.name) {
        statusValue = props.Status.status.name
      } else if (props.Status?.select?.name) {
        statusValue = props.Status.select.name
      } else if (props.Status?.rich_text?.[0]?.plain_text) {
        statusValue = props.Status.rich_text[0].plain_text
      }

      let priorityValue = 'Medium'
      if (props.Priority?.select?.name) {
        priorityValue = props.Priority.select.name
      } else if (props.Priority?.rich_text?.[0]?.plain_text) {
        priorityValue = props.Priority.rich_text[0].plain_text
      }

      return {
        id: page.id,
        title: getTitle(props.Name) || 'Untitled',
        status: statusValue,
        priority: priorityValue,
        due: getDate(props['Due Date']) || ''
      }
    })

    // Filter by status in JavaScript if requested
    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status === status)
    }

    return res.status(200).json({
      tasks,
      count: tasks.length,
      source: 'notion'
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return res.status(500).json({ error: 'Failed to fetch tasks' })
  }
}
