import type { NextApiRequest, NextApiResponse } from 'next'

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const PROJECT_OWNER = 'GuillaumeRacine'
const PROJECT_NUMBER = 4

const QUERY = `
query($owner: String!, $number: Int!) {
  user(login: $owner) {
    projectV2(number: $number) {
      items(first: 50) {
        nodes {
          fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue {
              name
            }
          }
          content {
            ... on Issue {
              title
              number
              url
            }
            ... on DraftIssue {
              title
            }
          }
        }
      }
    }
  }
}
`

interface ProjectItem {
  title: string
  status: string
  number: number
  url: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' })
  }

  try {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    const response = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner: PROJECT_OWNER, number: PROJECT_NUMBER },
      }),
    })

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }

    const json = await response.json()

    if (json.errors) {
      console.error('GitHub GraphQL errors:', json.errors)
      throw new Error(json.errors[0]?.message || 'GraphQL error')
    }

    const nodes = json.data?.user?.projectV2?.items?.nodes || []

    const items: ProjectItem[] = nodes
      .filter((node: any) => node.content)
      .map((node: any) => ({
        title: node.content.title || 'Untitled',
        status: node.fieldValueByName?.name || 'No Status',
        number: node.content.number || 0,
        url: node.content.url || '',
      }))

    // Group by status
    const grouped: Record<string, ProjectItem[]> = {}
    items.forEach(item => {
      if (!grouped[item.status]) grouped[item.status] = []
      grouped[item.status].push(item)
    })

    // Count by status
    const counts: Record<string, number> = {}
    Object.keys(grouped).forEach(status => {
      counts[status] = grouped[status].length
    })

    return res.status(200).json({
      grouped,
      counts,
      total: items.length,
      projectUrl: `https://github.com/users/${PROJECT_OWNER}/projects/${PROJECT_NUMBER}`,
    })
  } catch (error) {
    console.error('Error fetching GitHub project:', error)
    return res.status(500).json({ error: 'Failed to fetch GitHub project' })
  }
}
