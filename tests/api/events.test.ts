/**
 * @jest-environment node
 */
import { GET } from '@/app/api/k8s/events/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/events', () => {
  it('returns sorted event list', async () => {
    const mockEvents = {
      items: [
        {
          metadata: { name: 'evt-1', namespace: 'default' },
          involvedObject: { kind: 'Pod', name: 'pod-1' },
          reason: 'Scheduled',
          message: 'Successfully assigned',
          type: 'Normal',
          lastTimestamp: '2024-01-02T00:00:00Z',
          count: 1,
        },
      ],
    }
    const mockApi = { listEventForAllNamespaces: jest.fn().mockResolvedValue(mockEvents) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/events'))
    const data = await response.json()

    expect(data.events).toHaveLength(1)
    expect(data.events[0].reason).toBe('Scheduled')
  })
})
