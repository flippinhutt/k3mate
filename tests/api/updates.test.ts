/**
 * @jest-environment node
 */
import { GET, _resetCache } from '@/app/api/k8s/updates/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

const makeNodes = (version: string) => ({
  items: [{ metadata: { name: 'node-1' }, status: { nodeInfo: { kubeletVersion: version }, conditions: [], allocatable: {} } }],
})

describe('GET /api/k8s/updates', () => {
  beforeEach(() => {
    _resetCache()
    global.fetch = jest.fn()
  })

  it('returns hasUpdate true when versions differ', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.32.0+k3s1' }),
    })
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue({ listNode: jest.fn().mockResolvedValue(makeNodes('v1.31.5+k3s1')) })

    const response = await GET()
    const data = await response.json()

    expect(data.hasUpdate).toBe(true)
    expect(data.currentVersion).toBe('v1.31.5+k3s1')
    expect(data.latestVersion).toBe('v1.32.0+k3s1')
  })

  it('returns hasUpdate false when versions match', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.31.5+k3s1' }),
    })
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue({ listNode: jest.fn().mockResolvedValue(makeNodes('v1.31.5+k3s1')) })

    const response = await GET()
    const data = await response.json()

    expect(data.hasUpdate).toBe(false)
  })

  it('uses cached version and skips fetch on second call', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.32.0+k3s1' }),
    })
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue({ listNode: jest.fn().mockResolvedValue(makeNodes('v1.31.5+k3s1')) })

    await GET()
    await GET()

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
