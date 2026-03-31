import { NextRequest, NextResponse } from 'next/server'

/**
 * Cached entry for an image update check.
 *
 * @interface CacheEntry
 */
interface CacheEntry {
  /** Whether an update is available. */
  hasUpdate: boolean
  /** The latest tag found in the registry. */
  latestTag: string
  /** Timestamp of the last check. */
  checkedAt: number
}

/**
 * Registry response for Docker Hub tags.
 *
 * @interface DockerTagsResponse
 */
interface DockerTagsResponse {
  /** List of tag objects returned by the API. */
  results: { name: string }[]
}

const imageCache = new Map<string, CacheEntry>()
const TWELVE_HOURS = 12 * 60 * 60 * 1000

/**
 * Resets the internal image update cache.
 */
export function _resetCache() {
  imageCache.clear()
}

/**
 * Parses a full image reference string into its components.
 * Only supports Docker Hub images (library or user/repo).
 *
 * @param {string} image The full image reference.
 * @returns {{ namespace: string; name: string; tag: string } | null} Parsed components or null if unsupported.
 */
function parseImageRef(image: string): { namespace: string; name: string; tag: string } | null {
  // Skip digest-only images (no tag)
  const atIdx = image.indexOf('@')
  const withoutDigest = atIdx !== -1 ? image.slice(0, atIdx) : image
  if (atIdx !== -1 && !withoutDigest.includes(':')) return null

  const colonIdx = withoutDigest.lastIndexOf(':')
  const ref = colonIdx !== -1 ? withoutDigest.slice(0, colonIdx) : withoutDigest
  const tag = colonIdx !== -1 ? withoutDigest.slice(colonIdx + 1) : 'latest'

  // Skip non-Docker Hub registries (contain a dot before the first slash)
  const firstSlash = ref.indexOf('/')
  const beforeSlash = firstSlash !== -1 ? ref.slice(0, firstSlash) : ref
  if (beforeSlash.includes('.') && beforeSlash !== 'docker.io') return null

  const cleanRef = ref.replace(/^docker\.io\//, '')
  const parts = cleanRef.split('/')
  if (parts.length === 1) return { namespace: 'library', name: parts[0], tag }
  if (parts.length === 2) return { namespace: parts[0], name: parts[1], tag }
  return null
}

/**
 * Parses a numeric version array from a tag string.
 * Supports vX.Y.Z, X.Y, or simple versioning.
 *
 * @param {string} tag The version tag.
 * @returns {[number, number, number] | null} Major, Minor, Patch array or null.
 */
function parseVersion(tag: string): [number, number, number] | null {
  const m = tag.match(/^v?(\d+)\.(\d+)(?:\.(\d+))?$/)
  if (!m) return null
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3] ?? '0')]
}

/**
 * Compares two semantic version arrays.
 *
 * @param {[number, number, number]} a Version A.
 * @param {[number, number, number]} b Version B.
 * @returns {boolean} True if A is strictly newer than B.
 */
function isNewer(a: [number, number, number], b: [number, number, number]): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return false
}

/**
 * Checks Docker Hub for the latest tags of an image.
 *
 * @async
 * @param {string} namespace The Docker Hub namespace (e.g., "library").
 * @param {string} name The repository name.
 * @param {string} currentTag The currently used tag.
 * @returns {Promise<{ hasUpdate: boolean; latestTag: string }>} Update availability results.
 * @throws {Error} If the Docker Hub API call fails.
 */
async function checkDockerHub(namespace: string, name: string, currentTag: string) {
  const url = `https://hub.docker.com/v2/repositories/${namespace}/${name}/tags?page_size=25&ordering=last_updated`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Docker Hub ${res.status}`)
  const data = (await res.json()) as DockerTagsResponse

  const currentVer = parseVersion(currentTag)
  if (!currentVer) return { hasUpdate: false, latestTag: currentTag }

  let bestVer: [number, number, number] | null = null
  let bestTag = currentTag

  for (const { name: t } of data.results) {
    if (t === 'latest' || t === 'stable' || t === 'edge') continue
    const ver = parseVersion(t)
    if (ver && (!bestVer || isNewer(ver, bestVer))) {
      bestVer = ver
      bestTag = t
    }
  }

  const hasUpdate = bestVer ? isNewer(bestVer, currentVer) : false
  return { hasUpdate, latestTag: hasUpdate ? bestTag : currentTag }
}

/**
 * POST handler for bulk image update checks.
 * Compares a list of container images with their latest versions on Docker Hub.
 *
 * @async
 * @param {NextRequest} request The incoming HTTP request containing an array of image strings.
 * @returns {Promise<NextResponse>} A JSON response mapping each image to its update status.
 */
export async function POST(request: NextRequest) {
  try {
    const { images } = (await request.json()) as { images: string[] }
    const now = Date.now()
    const updates: Record<string, { hasUpdate: boolean; latestTag: string; checkedAt: string; checked: boolean }> = {}

    await Promise.allSettled(
      images.map(async image => {
        const cached = imageCache.get(image)
        if (cached && now - cached.checkedAt < TWELVE_HOURS) {
          updates[image] = { ...cached, checkedAt: new Date(cached.checkedAt).toISOString(), checked: true }
          return
        }

        const parsed = parseImageRef(image)
        if (!parsed) {
          updates[image] = { hasUpdate: false, latestTag: '', checkedAt: new Date(now).toISOString(), checked: false }
          return
        }

        try {
          const { hasUpdate, latestTag } = await checkDockerHub(parsed.namespace, parsed.name, parsed.tag)
          const entry: CacheEntry = { hasUpdate, latestTag, checkedAt: now }
          imageCache.set(image, entry)
          updates[image] = { ...entry, checkedAt: new Date(now).toISOString(), checked: true }
        } catch {
          updates[image] = { hasUpdate: false, latestTag: '', checkedAt: new Date(now).toISOString(), checked: false }
        }
      })
    )

    return NextResponse.json({ updates })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
