/**
 * @jest-environment node
 */
import { GET } from '@/app/api/k8s/pods/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/pods', () => {
  it('returns pod list for all namespaces', async () => {
    const mockPods = {
      items: [
        {
          metadata: { name: 'pod-1', namespace: 'default', labels: {} },
          status: { phase: 'Running', podIP: '10.0.0.1', containerStatuses: [] },
          spec: { nodeName: 'node-1', containers: [] },
        },
      ],
    }
    const mockApi = { listPodForAllNamespaces: jest.fn().mockResolvedValue(mockPods) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/pods'))
    const data = await response.json()

    expect(data.pods).toHaveLength(1)
    expect(data.pods[0].name).toBe('pod-1')
    expect(data.pods[0].phase).toBe('Running')
  })

  it('includes container ports and images in pod response', async () => {
    const mockPods = {
      items: [
        {
          metadata: { name: 'web', namespace: 'default' },
          status: { phase: 'Running', podIP: '10.0.0.2', containerStatuses: [] },
          spec: {
            nodeName: 'node-1',
            containers: [
              { name: 'app', image: 'nginx:1.24.0', ports: [{ containerPort: 3000, protocol: 'TCP', name: 'http' }] },
            ],
          },
        },
      ],
    }
    const mockApi = { listPodForAllNamespaces: jest.fn().mockResolvedValue(mockPods) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/pods'))
    const data = await response.json()

    expect(data.pods[0].ports).toEqual([{ name: 'http', containerPort: 3000, protocol: 'TCP' }])
    expect(data.pods[0].containers).toEqual([{ name: 'app', image: 'nginx:1.24.0' }])
  })
})
