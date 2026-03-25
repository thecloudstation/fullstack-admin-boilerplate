/**
 * Custom fetch wrapper used by Orval-generated API hooks.
 *
 * Orval passes a config object with { url, method, headers, data, signal }.
 * This wrapper serializes the body, sends the request, and returns typed JSON.
 */

export interface ApiError extends Error {
  status: number
  body: unknown
}

type RequestConfig = {
  url: string
  method: string
  headers?: Record<string, string>
  data?: unknown
  signal?: AbortSignal
}

export async function customFetch<T>(config: RequestConfig): Promise<T> {
  const { url, method, headers: configHeaders, data, signal } = config

  const headers = new Headers(configHeaders)

  let body: BodyInit | undefined

  if (data !== undefined && data !== null) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    body = JSON.stringify(data)
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    signal,
  })

  if (!response.ok) {
    let errorBody: unknown
    try {
      errorBody = await response.json()
    } catch {
      errorBody = await response.text().catch(() => null)
    }

    const error = new Error(
      `Request failed with status ${response.status}`,
    ) as ApiError
    error.status = response.status
    error.body = errorBody
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
