/**
 * @jest-environment node
 */
import { GET } from '@/app/api/k8s/nodes/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/nodes', () => {
  it('returns node list from cluster', async () => {
    const mockNodes = {
      items: [
        {
          metadata: { name: 'node-1', creationTimestamp: '2024-01-01' },
          status: {
            conditions: [{ type: 'Ready', status: 'True' }],
            allocatable: { cpu: '4', memory: '8Gi' },
          },
        },
      ],
    }
    const mockApi = { listNode: jest.fn().mockResolvedValue({ body: mockNodes }) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET()
    const data = await response.json()

    expect(data.nodes).toHaveLength(1)
    expect(data.nodes[0].name).toBe('node-1')
    expect(data.nodes[0].ready).toBe(true)
  })

  it('returns 500 on k8s API error', async () => {
    const mockApi = { listNode: jest.fn().mockRejectedValue(new Error('connection refused')) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET()
    expect(response.status).toBe(500)
  })
})
