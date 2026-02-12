import type { NextApiRequest, NextApiResponse } from 'next'
import { queryDatabase, DATABASES, getTitle, getSelect, getNumber, getRichText, getDate } from '../../lib/notion'
import { getCached, setCache, buildFingerprint } from '../../lib/cache'
import type { DigestItem, DigestDetail, DigestResponse } from '../../lib/types'

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const PROJECT_OWNER = 'GuillaumeRacine'
const PROJECT_NUMBER = 4
const REPO_NAME = 'ensemble_prototypes'

const TAO_ORDERS_DB = process.env.NOTION_TAO_ORDERS_DB || ''
const TAO_TASKS_DB = process.env.NOTION_TAO_TASKS_DB || ''

// --- Fetchers ---

async function fetchContentVault(): Promise<DigestItem[]> {
  if (!DATABASES.CONTENTVAULT) return []
  const response = await queryDatabase({
    database_id: DATABASES.CONTENTVAULT,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 5,
  })
  return response.results.map((page: any) => {
    const props = page.properties
    const title = getTitle(props.Link) || getTitle(props.Title) || getTitle(props.Name) || 'Untitled'
    const status = getSelect(props.Status)
    const type = getSelect(props.type) || ''
    const isNew = status === 'To Read' || status === 'Inbox'
    const details: DigestDetail[] = []
    if (status) details.push({ label: 'Status', value: status })
    if (type) details.push({ label: 'Type', value: type })
    return {
      id: `cv-${page.id}`,
      source: 'contentvault' as const,
      icon: 'CV',
      text: isNew ? `New article saved: ${title}` : `Article updated: ${title}`,
      details: details.length ? details : undefined,
      timestamp: page.last_edited_time,
      url: page.url,
      color: '#7c3aed',
    }
  })
}

async function fetchDataVault(): Promise<DigestItem[]> {
  if (!DATABASES.DATAVAULT) return []
  const response = await queryDatabase({
    database_id: DATABASES.DATAVAULT,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 5,
  })
  return response.results.map((page: any) => {
    const props = page.properties
    const title = getTitle(props.Title) || 'Untitled'
    const authors = getRichText(props.Authors) || ''
    const subject = getRichText(props.Subject) || ''
    const description = getRichText(props.Description) || ''
    const submission = getDate(props.Submission) || ''
    const isNew = Math.abs(new Date(page.created_time).getTime() - new Date(page.last_edited_time).getTime()) < 60000
    const details: DigestDetail[] = []
    if (authors) details.push({ label: 'Authors', value: authors })
    if (subject) details.push({ label: 'Subject', value: subject })
    if (description) details.push({ label: 'Description', value: description })
    if (submission) details.push({ label: 'Submitted', value: new Date(submission).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })
    return {
      id: `dv-${page.id}`,
      source: 'datavault' as const,
      icon: 'DV',
      text: isNew ? `Paper added: ${title}` : `Paper updated: ${title}`,
      details: details.length ? details : undefined,
      timestamp: page.last_edited_time,
      url: page.url,
      color: '#2563eb',
    }
  })
}

async function fetchTaoOrders(): Promise<DigestItem[]> {
  if (!TAO_ORDERS_DB) return []
  const response = await queryDatabase({
    database_id: TAO_ORDERS_DB,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 5,
  })
  return response.results.map((page: any) => {
    const props = page.properties
    const customer = getRichText(props.Customer) || getRichText(props.Name) || 'Unknown'
    const total = getNumber(props['Total $']) || 0
    const payment = getSelect(props.Payment) || ''
    const fulfillment = getSelect(props.Fulfillment) || ''
    const details: DigestDetail[] = []
    if (payment) details.push({ label: 'Payment', value: payment })
    if (fulfillment) details.push({ label: 'Fulfillment', value: fulfillment })
    return {
      id: `to-${page.id}`,
      source: 'tao-orders' as const,
      icon: 'TP',
      text: `Order received: ${customer} — $${total}`,
      details: details.length ? details : undefined,
      timestamp: page.created_time,
      url: `https://notion.so/${page.id.replace(/-/g, '')}`,
      color: '#f59e0b',
    }
  })
}

async function fetchTaoTasks(): Promise<DigestItem[]> {
  if (!TAO_TASKS_DB) return []
  const response = await queryDatabase({
    database_id: TAO_TASKS_DB,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 10,
  })
  // Filter to completed tasks only
  const completed = response.results.filter((page: any) => {
    const props = page.properties
    let status = ''
    if (props.Status?.status?.name) status = props.Status.status.name
    else if (props.Status?.select?.name) status = props.Status.select.name
    else if (props.Status?.rich_text?.[0]?.plain_text) status = props.Status.rich_text[0].plain_text
    return status === 'Done' || status === 'Completed'
  })
  return completed.slice(0, 5).map((page: any) => {
    const props = page.properties
    const title = getTitle(props.Name) || 'Untitled'
    let priority = ''
    if (props.Priority?.select?.name) priority = props.Priority.select.name
    else if (props.Priority?.rich_text?.[0]?.plain_text) priority = props.Priority.rich_text[0].plain_text
    const due = getDate(props['Due Date']) || ''
    const details: DigestDetail[] = []
    if (priority) details.push({ label: 'Priority', value: priority })
    if (due) details.push({ label: 'Due', value: due })
    return {
      id: `tt-${page.id}`,
      source: 'tao-tasks' as const,
      icon: 'TP',
      text: `Task completed: ${title}`,
      details: details.length ? details : undefined,
      timestamp: page.last_edited_time,
      url: `https://notion.so/${page.id.replace(/-/g, '')}`,
      color: '#22c55e',
    }
  })
}

async function fetchGitHub(): Promise<DigestItem[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return []

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Issues + Commits in parallel
  const [issuesResult, commitsResult] = await Promise.allSettled([
    fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `query($owner: String!, $number: Int!) {
          user(login: $owner) {
            projectV2(number: $number) {
              items(first: 10) {
                nodes {
                  updatedAt
                  fieldValueByName(name: "Status") {
                    ... on ProjectV2ItemFieldSingleSelectValue { name }
                  }
                  content {
                    ... on Issue {
                      title number url updatedAt
                      comments(last: 1) { totalCount nodes { author { login } body updatedAt } }
                      timelineItems(last: 1) { nodes { __typename } }
                      labels(first: 5) { nodes { name } }
                    }
                    ... on DraftIssue { title updatedAt }
                  }
                }
              }
            }
          }
        }`,
        variables: { owner: PROJECT_OWNER, number: PROJECT_NUMBER },
      }),
    }).then(r => r.json()),
    fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `query($owner: String!, $repo: String!, $count: Int!) {
          repository(owner: $owner, name: $repo) {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: $count) {
                    nodes { oid message committedDate url additions deletions changedFilesIfAvailable }
                  }
                }
              }
            }
          }
        }`,
        variables: { owner: PROJECT_OWNER, repo: REPO_NAME, count: 3 },
      }),
    }).then(r => r.json()),
  ])

  const items: DigestItem[] = []

  // Map GitHub timeline event types to human-readable actions
  const EVENT_LABELS: Record<string, string> = {
    IssueComment: 'Comment added',
    LabeledEvent: 'Label added',
    UnlabeledEvent: 'Label removed',
    AssignedEvent: 'Assigned',
    ClosedEvent: 'Closed',
    ReopenedEvent: 'Reopened',
    RenamedTitleEvent: 'Title changed',
    MilestonedEvent: 'Milestone set',
    ReferencedEvent: 'Referenced',
    CrossReferencedEvent: 'Cross-referenced',
    ConnectedEvent: 'Connected',
  }

  // Process issues
  if (issuesResult.status === 'fulfilled' && !issuesResult.value.errors) {
    const nodes = issuesResult.value.data?.user?.projectV2?.items?.nodes || []
    nodes
      .filter((n: any) => n.content?.title)
      .slice(0, 5)
      .forEach((node: any) => {
        const ts = node.content.updatedAt || node.updatedAt
        if (!ts) return

        // Determine what happened from timeline
        const lastEvent = node.content.timelineItems?.nodes?.[0]?.__typename || ''
        const action = EVENT_LABELS[lastEvent] || 'Issue updated'
        const boardStatus = node.fieldValueByName?.name || ''

        // Build structured details
        const details: DigestDetail[] = []
        const lastComment = node.content.comments?.nodes?.[0]
        const lastCommentBody = (lastComment?.body || '').trim()
        const lastCommentAuthor = lastComment?.author?.login
        if (lastEvent === 'IssueComment' && lastCommentBody) {
          if (lastCommentAuthor) details.push({ label: 'Author', value: `@${lastCommentAuthor}` })
          details.push({ label: 'Comment', value: lastCommentBody })
        }
        if (boardStatus) details.push({ label: 'Board', value: boardStatus })
        const labels = (node.content.labels?.nodes || []).map((l: any) => l.name).filter(Boolean)
        if (labels.length) details.push({ label: 'Labels', value: labels.join(', ') })

        items.push({
          id: `gh-i-${node.content.number || node.content.title}`,
          source: 'github',
          icon: 'GH',
          text: `${action}: ${node.content.title}`,
          details: details.length ? details : undefined,
          timestamp: ts,
          url: node.content.url,
          color: '#9ca3af',
        })
      })
  }

  // Process commits
  if (commitsResult.status === 'fulfilled' && !commitsResult.value.errors) {
    const commits = commitsResult.value.data?.repository?.defaultBranchRef?.target?.history?.nodes || []
    commits.forEach((c: any) => {
      const lines = (c.message || '').split('\n')
      const firstLine = lines[0]
      const additions = c.additions || 0
      const deletions = c.deletions || 0
      const changedFiles = c.changedFilesIfAvailable || 0
      const details: DigestDetail[] = []
      const statParts: string[] = []
      if (changedFiles) statParts.push(`${changedFiles} file${changedFiles > 1 ? 's' : ''}`)
      if (additions) statParts.push(`+${additions}`)
      if (deletions) statParts.push(`-${deletions}`)
      if (statParts.length) details.push({ label: 'Changes', value: statParts.join(' · ') })
      const body = lines.slice(1).map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('Co-Authored-By')).join('\n')
      if (body) details.push({ label: 'Message', value: body })
      items.push({
        id: `gh-c-${c.oid?.slice(0, 7)}`,
        source: 'github',
        icon: 'GH',
        text: `Commit: ${firstLine}`,
        details: details.length ? details : undefined,
        timestamp: c.committedDate,
        url: c.url,
        color: '#9ca3af',
      })
    })
  }

  return items
}

// --- Main handler ---

const CACHE_KEY = 'digest-feed'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    // Check server cache
    const cached = getCached<DigestResponse>(CACHE_KEY, '')
    if (cached) {
      return res.status(200).json({ ...cached, cached: true })
    }

    // Fetch all 5 sources in parallel
    const results = await Promise.allSettled([
      fetchContentVault(),
      fetchDataVault(),
      fetchTaoOrders(),
      fetchTaoTasks(),
      fetchGitHub(),
    ])

    // Merge all successful results
    const allItems: DigestItem[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value)
      }
    }

    // Sort by timestamp descending, take top 10
    const sorted = allItems
      .filter(item => item.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    const response: DigestResponse = {
      items: sorted,
      generatedAt: new Date().toISOString(),
      cached: false,
    }

    // Cache with fingerprint
    const fingerprint = buildFingerprint(
      sorted.map(i => ({ id: i.id, lastEdited: i.timestamp }))
    )
    setCache(CACHE_KEY, response, fingerprint)

    return res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching digest:', error)
    return res.status(500).json({ error: 'Failed to fetch digest' })
  }
}
