// Tao Promotion types
export interface TaoOrder {
  id: string
  name: string
  total: string
  date: string
  payment: string
  fulfillment: string
}

export interface TaoTask {
  id: string
  title: string
  status: string
  priority: string
  due: string
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
  category: string
  status: string
  url?: string
}

export interface DataVaultData {
  metrics: {
    totalItems: number
  }
  status: string
  items: DataItem[]
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
