import { NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

/**
 * GET handler for retrieving cluster nodes and their health status.
 *
 * @returns {Promise<NextResponse>} A JSON response containing an array of cluster nodes and health info.
 */
export async function GET() {
  try {
    const api = getCoreV1Api()
    const result = await api.listNode()
    const nodes = result.items.map(node => ({
      name: node.metadata?.name ?? 'unknown',
      ready: node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
      createdAt: node.metadata?.creationTimestamp,
      kubeletVersion: node.status?.nodeInfo?.kubeletVersion,
      allocatable: {
        cpu: node.status?.allocatable?.cpu,
        memory: node.status?.allocatable?.memory,
      },
    }))
    return NextResponse.json({ nodes })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
