import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { queryDatabase, DATABASES, getTitle, getSelect, getUrl, getFileUrl, getRichText, getDate } from '../../../lib/notion'
import { getCached, setCache, buildFingerprint } from '../../../lib/cache'
import type { ContentItem, DataItem, MediaInsightItem, MediaInsightsResponse } from '../../../lib/types'

const CACHE_KEY = 'ai-media-insights'

// Tao Tasks DB for context
const TAO_TASKS_DB = process.env.NOTION_TAO_TASKS_DB || ''

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    // 1. Fetch ContentVault + DataVault + Tasks in parallel
    const [contentResult, dataResult, tasksResult] = await Promise.allSettled([
      DATABASES.CONTENTVAULT
        ? queryDatabase({ database_id: DATABASES.CONTENTVAULT, page_size: 100 })
        : Promise.reject('not configured'),
      DATABASES.DATAVAULT
        ? queryDatabase({ database_id: DATABASES.DATAVAULT, page_size: 100 })
        : Promise.reject('not configured'),
      TAO_TASKS_DB
        ? queryDatabase({
            database_id: TAO_TASKS_DB,
            page_size: 20,
            sorts: [{ timestamp: 'created_time', direction: 'descending' }]
          })
        : Promise.reject('not configured'),
    ])

    // 2. Process ContentVault items (columns: Link, type, Status, Audio summary, Audio Link)
    const contentItems: ContentItem[] = contentResult.status === 'fulfilled'
      ? contentResult.value.results.map((page: any) => {
          const props = page.properties
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
            lastEdited: page.last_edited_time,
          }
        })
      : []

    // 3. Process DataVault items
    const dataItems: DataItem[] = dataResult.status === 'fulfilled'
      ? dataResult.value.results.map((page: any) => {
          const props = page.properties
          return {
            id: page.id,
            title: getTitle(props.Title) || 'Untitled',
            authors: getRichText(props.Authors) || '',
            subject: getRichText(props.Subject) || '',
            submission: getDate(props.Submission) || undefined,
            url: getUrl(props['pdf Link']) || undefined,
            lastEdited: page.last_edited_time,
          }
        })
      : []

    // 4. Process Tasks (for context)
    const activeTasks: string[] = tasksResult.status === 'fulfilled'
      ? tasksResult.value.results
          .map((page: any) => {
            const props = page.properties
            let status = ''
            if (props.Status?.status?.name) status = props.Status.status.name
            else if (props.Status?.select?.name) status = props.Status.select.name
            else if (props.Status?.rich_text?.[0]?.plain_text) status = props.Status.rich_text[0].plain_text
            const title = getTitle(props.Name) || 'Untitled'
            return { title, status }
          })
          .filter((t: any) => t.status === 'In Progress' || t.status === 'To Do')
          .map((t: any) => t.title)
      : []

    // If no items at all, return empty
    if (contentItems.length === 0 && dataItems.length === 0) {
      return res.status(200).json({ items: [], generatedAt: new Date().toISOString(), cached: false })
    }

    // 5. Check cache via fingerprint
    const allItemsForFingerprint = [
      ...contentItems.map(i => ({ id: i.id, lastEdited: i.lastEdited })),
      ...dataItems.map(i => ({ id: i.id, lastEdited: i.lastEdited })),
    ]
    const fingerprint = buildFingerprint(allItemsForFingerprint)

    const cached = getCached<MediaInsightsResponse>(CACHE_KEY, fingerprint)
    if (cached) {
      return res.status(200).json({ ...cached, cached: true })
    }

    // 6. No API key → fallback (sorted by date, no AI)
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
      const fallback = buildFallbackResponse(contentItems, dataItems)
      setCache(CACHE_KEY, fallback, fingerprint)
      return res.status(200).json({ ...fallback, cached: false })
    }

    // 7. Call Claude Haiku 4.5
    const aiItems = await callClaudeForInsights(contentItems, dataItems, activeTasks)

    // 8. Validate AI IDs against real data + enrich
    const allItemsMap = new Map<string, { vault: 'CV' | 'DV'; item: ContentItem | DataItem }>()
    contentItems.forEach(i => allItemsMap.set(i.id, { vault: 'CV', item: i }))
    dataItems.forEach(i => allItemsMap.set(i.id, { vault: 'DV', item: i }))

    const enrichedItems: MediaInsightItem[] = aiItems
      .filter(ai => allItemsMap.has(ai.id)) // Drop hallucinated IDs
      .map(ai => {
        const real = allItemsMap.get(ai.id)!
        const item = real.item
        return {
          id: ai.id,
          title: item.title,
          vault: real.vault,
          summary: ai.summary || '',
          relevanceScore: Math.min(100, Math.max(0, ai.relevanceScore || 0)),
          relevanceReason: ai.relevanceReason || '',
          url: item.url,
          lastEdited: item.lastEdited,
          ...('source' in item ? { source: item.source, type: item.type, status: item.status } : {}),
          ...('authors' in item ? { authors: item.authors, subject: item.subject } : {}),
        }
      })
      .slice(0, 5) // Max 5 items

    const response: MediaInsightsResponse = {
      items: enrichedItems.length > 0 ? enrichedItems : buildFallbackResponse(contentItems, dataItems).items,
      generatedAt: new Date().toISOString(),
      cached: false,
    }

    setCache(CACHE_KEY, response, fingerprint)
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error in media-insights:', error)
    return res.status(500).json({ error: 'Failed to generate media insights' })
  }
}

// Fallback: top 5 by recency, no AI summaries
function buildFallbackResponse(contentItems: ContentItem[], dataItems: DataItem[]): MediaInsightsResponse {
  type MergedItem = { id: string; title: string; vault: 'CV' | 'DV'; lastEdited: string; url?: string; source?: string; type?: string; status?: string; authors?: string; subject?: string }
  const merged: MergedItem[] = [
    ...contentItems.map(i => ({ id: i.id, title: i.title, vault: 'CV' as const, lastEdited: i.lastEdited || '', url: i.url, source: i.source, type: i.type, status: i.status })),
    ...dataItems.map(i => ({ id: i.id, title: i.title, vault: 'DV' as const, lastEdited: i.lastEdited || '', url: i.url, authors: i.authors, subject: i.subject })),
  ]

  const top = merged
    .filter(i => i.lastEdited)
    .sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime())
    .slice(0, 5)

  return {
    items: top.map(i => ({
      id: i.id,
      title: i.title,
      vault: i.vault,
      summary: '',
      relevanceScore: 0,
      relevanceReason: '',
      url: i.url,
      lastEdited: i.lastEdited,
      source: i.source,
      type: i.type,
      status: i.status,
      authors: i.authors,
      subject: i.subject,
    })),
    generatedAt: new Date().toISOString(),
    cached: false,
  }
}

interface AIItem {
  id: string
  summary: string
  relevanceScore: number
  relevanceReason: string
}

async function callClaudeForInsights(
  contentItems: ContentItem[],
  dataItems: DataItem[],
  activeTasks: string[]
): Promise<AIItem[]> {
  const anthropic = new Anthropic()

  // Build the prompt data
  const cvData = contentItems.map(i => ({
    id: i.id, title: i.title, source: i.source, type: i.type, status: i.status, lastEdited: i.lastEdited,
  }))
  const dvData = dataItems.map(i => ({
    id: i.id, title: i.title, authors: i.authors, subject: i.subject, lastEdited: i.lastEdited,
  }))

  const prompt = `You are a personal media curator. Analyze these items and select the TOP 5 most relevant ones to review now.

## ContentVault items (CV):
${JSON.stringify(cvData, null, 2)}

## DataVault items (DV - research papers):
${JSON.stringify(dvData, null, 2)}

## Active tasks for context:
${activeTasks.length > 0 ? activeTasks.map(t => `- ${t}`).join('\n') : 'No active tasks'}

## Prioritization criteria:
- Recency: recently edited items are more actionable
- Status: "To Read" or "Inbox" items need attention
- Alignment: items related to active tasks are boosted
- Diversity: mix ContentVault and DataVault items
- Novelty: newly added items should be surfaced

Return a JSON array of exactly 5 items (or fewer if less than 5 total). Each item:
{
  "id": "the exact Notion page ID",
  "summary": "1-sentence summary of what this is and why it matters (max 80 chars)",
  "relevanceScore": 0-100,
  "relevanceReason": "short reason why now (max 50 chars)"
}

Return ONLY the JSON array, no other text.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  // Extract text from response
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('')

  // Parse JSON (handle potential markdown code blocks)
  const jsonStr = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
  const parsed = JSON.parse(jsonStr)

  if (!Array.isArray(parsed)) return []

  return parsed.map((item: any) => ({
    id: String(item.id || ''),
    summary: String(item.summary || ''),
    relevanceScore: Number(item.relevanceScore) || 0,
    relevanceReason: String(item.relevanceReason || ''),
  }))
}
