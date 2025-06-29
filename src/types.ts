export interface FileSummary {
  path: string
  content: string
  summary?: string
  error?: string
}

export interface OllamaResponse {
  model: string
  response: string
  done: boolean
}
