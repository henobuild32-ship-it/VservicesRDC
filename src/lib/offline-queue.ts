export type OfflineActionState = 'pending' | 'sent' | 'failed'

export interface OfflineAction {
  id: string
  endpoint: string
  method: string
  headers: Record<string, string>
  body?: unknown
  state: OfflineActionState
  createdAt: string
}

export function offlineIdempotencyKey(prefix = 'vservice') {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `${prefix}-${Date.now()}-${random}`
}

export async function registerOfflineSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('vservice-sync')
  } catch { /* Certains navigateurs mobiles ne proposent pas Background Sync. */ }
}

export async function queueOfflineAction(endpoint: string, body: unknown, headers: Record<string, string>) {
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  if (response.status !== 202) return response
  await registerOfflineSync()
  return response
}
