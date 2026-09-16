export function formatRam(used: number | null, total: number | null): string {
  if (used == null) return '—'
  if (total == null) return `${Math.round(used)}G`
  return `${Math.round(used)}/${Math.round(total)}G`
}

export function formatUsedGb(used: number | null): string {
  if (used == null) return '—'
  return `${Math.round(used)}G`
}

export function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value)}%`
}

export function formatReset(iso: string): string {
  const resetAt = new Date(iso).getTime()
  if (Number.isNaN(resetAt)) return iso
  const delta = Math.max(0, resetAt - Date.now())
  const hours = Math.floor(delta / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days >= 1) return `${days}d`
  if (hours >= 1) return `${hours}h`
  const minutes = Math.max(1, Math.floor(delta / 60_000))
  return `${minutes}m`
}
