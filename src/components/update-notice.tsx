'use client'

import { useEffect, useState } from 'react'

export function UpdateNotice() {
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const response = await fetch('/api/version', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json() as { version?: string }
        const current = localStorage.getItem('vservice-version')
        if (current && data.version && current !== data.version) setUpdated(true)
        if (data.version) localStorage.setItem('vservice-version', data.version)
      } catch { /* hors connexion */ }
    }
    void check()
    const interval = window.setInterval(() => { if (active) void check() }, 60_000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])

  if (!updated) return null
  return <div className="fixed inset-x-2 bottom-20 z-[100] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3 text-sm shadow-xl" role="status" aria-live="polite"><span>Une nouvelle version est disponible.</span><button className="min-h-11 rounded-lg bg-emerald-600 px-3 font-semibold text-white" onClick={() => window.location.reload()}>Actualiser</button></div>
}
