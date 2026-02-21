const API_BASE = '/api'

export async function checkDomains(domains, tlds, onProgress, onResult) {
  const response = await fetch(`${API_BASE}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains, tlds })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const data = JSON.parse(line.slice(5).trim())
          if (data.result) {
            onResult(data.result)
            onProgress(data.progress, data.total)
          } else if (data.total !== undefined && !data.result) {
            onProgress(0, data.total)
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function recheckDomains(ids, onProgress, onResult) {
  const response = await fetch(`${API_BASE}/recheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const data = JSON.parse(line.slice(5).trim())
          if (data.result) {
            onResult(data.result)
            onProgress(data.progress, data.total)
          } else if (data.total !== undefined && !data.result) {
            onProgress(0, data.total)
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function getResults(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.tld) params.set('tld', filters.tld)
  if (filters.search) params.set('search', filters.search)

  const response = await fetch(`${API_BASE}/results?${params}`)
  const data = await response.json()
  return data.results
}

export async function deleteResult(id) {
  await fetch(`${API_BASE}/results/${id}`, { method: 'DELETE' })
}

export async function deleteResults(ids) {
  await fetch(`${API_BASE}/results/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  })
}

export function exportCsv() {
  window.open(`${API_BASE}/export`, '_blank')
}

export async function getKnownTlds() {
  try {
    const response = await fetch(`${API_BASE}/tlds`)
    const data = await response.json()
    return data.tlds || []
  } catch (e) {
    console.error('Failed to fetch TLDs:', e)
    return []
  }
}
