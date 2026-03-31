import { NextResponse } from 'next/server'
import { getCustomObjectsApi } from '@/lib/k8s-client'
import { parseCpu, parseMemory } from '@/lib/utils'

/**
 * GET handler for retrieving real-time node usage metrics.
 * Fetches data from metrics.k8s.io/v1beta1 API.
 * 
 * @returns {Promise<NextResponse>} A JSON response containing mapped node usage metrics.
 */
export async function GET() {
  try {
    const api = getCustomObjectsApi()
    
    // Attempt to fetch from metrics.k8s.io
    const { body } = await api.listClusterCustomObject({
      group: 'metrics.k8s.io',
      version: 'v1beta1',
      plural: 'nodes'
    })

    interface NodeMetric {
      metadata: { name: string }
      usage: { cpu: string; memory: string }
    }

    const items = (body as { items: NodeMetric[] }).items || []
    
    // Map response to standard bytes and millicores
    const metricsInfo = items.reduce((acc: Record<string, { cpuUsage: number; memoryUsage: number }>, item: NodeMetric) => {
      acc[item.metadata.name] = {
        cpuUsage: parseCpu(item.usage.cpu),
        memoryUsage: parseMemory(item.usage.memory)
      }
      return acc
    }, {})

    return NextResponse.json({ metrics: metricsInfo })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
      return NextResponse.json({ error: 'Metrics Server not installed or unavailable' }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
