// Tao Promotion types
export interface TaoOrder {
  id: string
  name: string
  total: string
  date: string
  payment: string
  fulfillment: string
  url?: string
}

export interface TaoTask {
  id: string
  title: string
  status: string
  priority: string
  due: string
  url?: string
}

export interface TaoReview {
  id: string
  title: string
  content: string
  userName?: string
}

export interface TaoStatus {
  metrics: {
    unfulfilled: number
    amazonSales: number
    amazonReviews: number
    shopifySales: string
  }
  goals: {
    amazonSales: number
    amazonComReviews: number
    amazonCaReviews: number
    subscribers: number
  }
}

// ContentVault types
export interface ContentItem {
  id: string
  title: string
  source: string
  type: string
  status: string
  url?: string
  lastEdited?: string
}

export interface ContentVaultData {
  metrics: {
    totalItems: number
    toRead: number
    inbox: number
  }
  bySource: Array<{ source: string; count: number }>
  byType: Array<{ type: string; count: number }>
  items: ContentItem[]
}

// DataVault types
export interface DataItem {
  id: string
  title: string
  authors: string
  subject: string
  description?: string
  submission?: string
  url?: string
  lastEdited?: string
}

export interface DataVaultData {
  metrics: {
    totalItems: number
  }
  status: string
  items: DataItem[]
}

// AI Media Insights types
export interface MediaInsightItem {
  id: string
  title: string
  vault: 'CV' | 'DV'
  summary: string
  relevanceScore: number
  relevanceReason: string
  url?: string
  lastEdited?: string
  source?: string
  type?: string
  status?: string
  authors?: string
  subject?: string
}

export interface MediaInsightsResponse {
  items: MediaInsightItem[]
  generatedAt: string
  cached: boolean
}

// Digest Feed types
export interface DigestDetail {
  label: string
  value: string
}

export interface DigestItem {
  id: string
  source: 'contentvault' | 'datavault' | 'tao-orders' | 'tao-tasks' | 'github'
  icon: string
  text: string
  details?: DigestDetail[]
  timestamp: string
  url?: string
  color?: string
}

export interface DigestResponse {
  items: DigestItem[]
  generatedAt: string
  cached: boolean
}

// Vault card types (for dashboard)
export interface VaultMetrics {
  [key: string]: number | string
}

export interface VaultData {
  name: string
  url: string
  description: string
  icon: string
  metrics: VaultMetrics
  status?: string
}
