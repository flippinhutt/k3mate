/**
 * UpdateBanner checks for k3s cluster updates via an internal API.
 * If an update is available, it displays a banner with the version diff 
 * and a link to the k3s releases page.
 *
 * @component
 * @async
 * @returns {Promise<JSX.Element | null>} The rendered banner or null if no update exists.
 */
export async function UpdateBanner() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/k8s/updates`, { next: { revalidate: 43200 } })
    if (!res.ok) return null
    const { hasUpdate, currentVersion, latestVersion } = await res.json()
    if (!hasUpdate) return null
    return (
      <div className="mx-4 mt-4 md:mx-6 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={1.5} className="w-5 h-5 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-green-300 font-medium">k3s update available</span>
          <span className="text-xs text-slate-400 ml-2 font-mono">{currentVersion} → {latestVersion}</span>
        </div>
        <a
          href="https://github.com/k3s-io/k3s/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-400 hover:text-green-300 transition-colors cursor-pointer shrink-0"
        >
          Release notes
        </a>
      </div>
    )
  } catch {
    return null
  }
}
