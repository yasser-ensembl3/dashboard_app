import { Client } from '@notionhq/client'
import type { QueryDatabaseParameters, QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'

// Initialize Notion client
const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Export a typed query function
export async function queryDatabase(params: QueryDatabaseParameters): Promise<QueryDatabaseResponse> {
  return notionClient.databases.query(params)
}

// Database IDs
export const DATABASES = {
  CONTENTVAULT: process.env.NOTION_CONTENTVAULT_DB || '',
  DATAVAULT: process.env.NOTION_DATAVAULT_DB || '',
}

// Helper to extract text from Notion rich text
export function getRichText(property: any): string {
  if (!property?.rich_text) return ''
  return property.rich_text.map((t: any) => t.plain_text).join('')
}

// Helper to extract title from Notion title property
export function getTitle(property: any): string {
  if (!property?.title) return ''
  return property.title.map((t: any) => t.plain_text).join('')
}

// Helper to extract number
export function getNumber(property: any): number {
  return property?.number ?? 0
}

// Helper to extract select
export function getSelect(property: any): string {
  return property?.select?.name || ''
}

// Helper to extract multi-select
export function getMultiSelect(property: any): string[] {
  if (!property?.multi_select) return []
  return property.multi_select.map((s: any) => s.name)
}

// Helper to extract date
export function getDate(property: any): string {
  return property?.date?.start || ''
}

// Helper to extract URL
export function getUrl(property: any): string {
  return property?.url || ''
}

// Helper to extract Person (people) field
export function getPerson(property: any): string {
  if (!property?.people || property.people.length === 0) return ''
  return property.people.map((p: any) => p.name || p.person?.email || '').filter(Boolean).join(', ')
}

// Helper to extract any text-like property (tries multiple types)
export function getAnyText(property: any): string {
  if (!property) return ''
  // Try rich_text
  if (property.rich_text) {
    return property.rich_text.map((t: any) => t.plain_text).join('')
  }
  // Try title
  if (property.title) {
    return property.title.map((t: any) => t.plain_text).join('')
  }
  // Try people
  if (property.people && property.people.length > 0) {
    return property.people.map((p: any) => p.name || '').filter(Boolean).join(', ')
  }
  // Try select
  if (property.select) {
    return property.select.name || ''
  }
  // Try email
  if (property.email) {
    return property.email
  }
  return ''
}

// Helper to format date for display
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
