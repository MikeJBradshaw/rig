export interface ApiSuccess<T> {
  data: T
}

export interface ApiEnqueued<T> {
  event: T
}

export interface ApiError {
  message: string
  // optional but nice for debugging
  code?: string
  details?: unknown
}
