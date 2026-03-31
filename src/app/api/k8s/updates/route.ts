import { NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

/**
 * Cached version information for the latest k3s release.
 *
 * @interface UpdateCache
 */
interface UpdateCache {
  /** The latest version tag from GitHub. */
  version: string
  /** Timestamp when the check was performed. */
  checkedAt: number
}

let cache: UpdateCache | null = null
const TWELVE_HOURS = 12 * 60 * 60 * 1000

/**
 * Resets the internal update cache for testing purposes.
 */
export function _resetCache() {
  cache = null
}

/**
 * Fetches the latest k3s release version from the GitHub API.
 *
 * @async
 * @returns {Promise<string>} The latest version tag (e.g., "v1.31.2+k3s1").
 * @throws {Error} If the GitHub API call fails.
 */
async function fetchLatestK3sVersion(): Promise<string> {
  const res = await fetch('https://api.github.com/repos/k3s-io/k3s/releases/latest', {
    headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'k3mate/1.0' },
  })
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`)
  const data = (await res.json()) as { tag_name: string }
  return data.tag_name
}

/**
 * GET handler for checking k3s cluster updates.
 * Compares the current cluster node version with the latest release on GitHub.
 *
 * @async
 * @returns {Promise<NextResponse>} A JSON response with update availability information.
 */
export async function GET() {
  try {
    const now = Date.now()
    if (!cache || now - cache.checkedAt > TWELVE_HOURS) {
      const version = await fetchLatestK3sVersion()
      cache = { version, checkedAt: now }
    }

    const api = getCoreV1Api()
    const nodes = await api.listNode()
    const currentVersion = nodes.items[0]?.status?.nodeInfo?.kubeletVersion ?? 'unknown'
    const latestVersion = cache.version
    const hasUpdate = currentVersion !== 'unknown' && latestVersion !== currentVersion

    return NextResponse.json({
      hasUpdate,
      currentVersion,
      latestVersion,
      checkedAt: new Date(cache.checkedAt).toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
