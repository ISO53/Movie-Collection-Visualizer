export interface ImportProgress {
  current: number
  total: number
  currentTitle: string
  elapsedSecs: number
}

export interface FailedImport {
  fileName: string
  parsedTitle: string
}

export interface ImportComplete {
  totalImported: number
  failed: number
  rateLimited: boolean
  cancelled: boolean
  failedItems: FailedImport[]
}

export interface WatchedDirSyncResult {
  newCount: number
  removedCount: number
  rateLimited: boolean
}
