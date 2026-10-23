'use client'

import { useEffect, useState } from 'react'

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine)
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      className="sticky top-0 z-[100] w-full bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950"
      role="status"
      aria-live="polite"
    >
      Hors ligne — les pages déjà consultées restent disponibles.
    </div>
  )
}
