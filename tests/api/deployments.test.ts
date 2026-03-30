/**
 * @jest-environment node
 */
import { GET } from '@/app/api/k8s/deployments/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/deployments', () => {
  it('returns deployment list', async () => {
    const mockDeployments = {
      items: [
        {
          metadata: { name: 'nginx', namespace: 'default' },
          spec: { replicas: 3 },
          status: { readyReplicas: 3, availableReplicas: 3 },
        },
      ],
    }
    const mockApi = { listDeploymentForAllNamespaces: jest.fn().mockResolvedValue({ body: mockDeployments }) }
    ;(k8sClient.getAppsV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/deployments'))
    const data = await response.json()

    expect(data.deployments).toHaveLength(1)
    expect(data.deployments[0].name).toBe('nginx')
    expect(data.deployments[0].readyReplicas).toBe(3)
  })
})
