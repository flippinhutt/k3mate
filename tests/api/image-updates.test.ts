/**
 * @jest-environment node
 */
import { POST, _resetCache } from '@/app/api/k8s/image-updates/route'

describe('POST /api/k8s/image-updates', () => {
  beforeEach(() => {
    _resetCache()
    global.fetch = jest.fn()
  })

  function makeRequest(images: string[]) {
    return new Request('http://localhost/api/k8s/image-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    })
  }

  function mockDockerHub(tags: string[]) {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: tags.map(name => ({ name })) }),
    })
  }

  it('detects newer version when available on Docker Hub', async () => {
    mockDockerHub(['1.25.3', '1.25.2', '1.24.0', '1.24.1', 'latest', 'stable'])

    const response = await POST(makeRequest(['nginx:1.24.0']))
    const data = await response.json()

    expect(data.updates['nginx:1.24.0'].hasUpdate).toBe(true)
    expect(data.updates['nginx:1.24.0'].latestTag).toBe('1.25.3')
  })

  it('returns no update when already on latest', async () => {
    mockDockerHub(['1.24.0', '1.23.0', 'latest'])

    const response = await POST(makeRequest(['nginx:1.24.0']))
    const data = await response.json()

    expect(data.updates['nginx:1.24.0'].hasUpdate).toBe(false)
  })

  it('marks non-Docker-Hub images as unchecked', async () => {
    const response = await POST(makeRequest(['ghcr.io/owner/repo:v1.0']))
    const data = await response.json()

    expect(data.updates['ghcr.io/owner/repo:v1.0'].checked).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('uses cached result on second call', async () => {
    mockDockerHub(['1.25.0', '1.24.0'])

    await POST(makeRequest(['nginx:1.24.0']))
    await POST(makeRequest(['nginx:1.24.0']))

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('handles Docker Hub API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429 })

    const response = await POST(makeRequest(['nginx:1.24.0']))
    const data = await response.json()

    expect(data.updates['nginx:1.24.0'].checked).toBe(false)
    expect(data.updates['nginx:1.24.0'].hasUpdate).toBe(false)
  })
})
