export interface ImportProgress {
  current: number
  total: number
  currentTitle: string
  elapsedSecs: number
}

export interface ImportComplete {
  totalImported: number
  failed: number
  rateLimited: boolean
  cancelled: boolean
}

export interface WatchedDirSyncResult {
  newCount: number
  removedCount: number
  rateLimited: boolean
}
