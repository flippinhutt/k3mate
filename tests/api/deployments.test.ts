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
          spec: { replicas: 3, template: { spec: { containers: [] } } },
          status: { readyReplicas: 3, availableReplicas: 3, updatedReplicas: 3, conditions: [] },
        },
      ],
    }
    const mockApi = { listDeploymentForAllNamespaces: jest.fn().mockResolvedValue(mockDeployments) }
    ;(k8sClient.getAppsV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/deployments'))
    const data = await response.json()

    expect(data.deployments).toHaveLength(1)
    expect(data.deployments[0].name).toBe('nginx')
    expect(data.deployments[0].readyReplicas).toBe(3)
  })

  it('includes images and update status in deployment response', async () => {
    const mockDeployments = {
      items: [
        {
          metadata: { name: 'app', namespace: 'production' },
          spec: {
            replicas: 3,
            template: {
              spec: {
                containers: [{ name: 'web', image: 'myapp:v2.0' }],
              },
            },
          },
          status: {
            readyReplicas: 2,
            availableReplicas: 2,
            updatedReplicas: 1,
            conditions: [
              { type: 'Progressing', status: 'True', reason: 'ReplicaSetUpdated', message: 'Updating...' },
            ],
          },
        },
      ],
    }
    const mockApi = { listDeploymentForAllNamespaces: jest.fn().mockResolvedValue(mockDeployments) }
    ;(k8sClient.getAppsV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/deployments'))
    const data = await response.json()

    expect(data.deployments[0].images).toEqual([{ name: 'web', image: 'myapp:v2.0' }])
    expect(data.deployments[0].updatedReplicas).toBe(1)
    expect(data.deployments[0].conditions).toEqual([
      { type: 'Progressing', status: 'True', reason: 'ReplicaSetUpdated', message: 'Updating...' },
    ])
  })
})
