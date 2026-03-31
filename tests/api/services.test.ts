/**
 * @jest-environment node
 */
import { GET } from '@/app/api/k8s/services/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/services', () => {
  it('returns service list with ports', async () => {
    const mockServices = {
      items: [
        {
          metadata: { name: 'nginx-svc', namespace: 'default' },
          spec: {
            type: 'NodePort',
            clusterIP: '10.96.0.1',
            ports: [
              { name: 'http', port: 80, targetPort: 80, nodePort: 30080, protocol: 'TCP' },
            ],
          },
        },
      ],
    }
    const mockApi = { listServiceForAllNamespaces: jest.fn().mockResolvedValue(mockServices) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/services'))
    const data = await response.json()

    expect(data.services).toHaveLength(1)
    expect(data.services[0].name).toBe('nginx-svc')
    expect(data.services[0].type).toBe('NodePort')
    expect(data.services[0].ports[0].nodePort).toBe(30080)
  })

  it('filters by namespace when provided', async () => {
    const mockServices = { items: [] }
    const mockApi = { listNamespacedService: jest.fn().mockResolvedValue(mockServices) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    await GET(new Request('http://localhost/api/k8s/services?namespace=default'))
    expect(mockApi.listNamespacedService).toHaveBeenCalledWith({ namespace: 'default' })
  })
})
