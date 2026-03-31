import { NextRequest, NextResponse } from 'next/server'
import { getCustomObjectsApi } from '@/lib/k8s-client'
import { parseCpu, parseMemory } from '@/lib/utils'

/**
 * GET handler for retrieving real-time pod usage metrics.
 * Fetches data from metrics.k8s.io/v1beta1 API.
 * Supports filtering by namespace via the 'namespace' query parameter.
 * 
 * @param {NextRequest} request The incoming HTTP request.
 * @returns {Promise<NextResponse>} A JSON response containing mapped pod usage metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const namespace = new URL(request.url).searchParams.get('namespace') ?? undefined
    const api = getCustomObjectsApi()
    
    // Attempt to fetch from metrics.k8s.io
    let body: unknown
    if (namespace) {
      const resp = await api.listNamespacedCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        namespace,
        plural: 'pods'
      })
      body = resp.body
    } else {
      const resp = await api.listClusterCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        plural: 'pods'
      })
      body = resp.body
    }

    interface PodMetric {
      metadata: { name: string, namespace: string }
      containers: { name: string; usage: { cpu: string; memory: string } }[]
      window: string
      timestamp: string
    }

    const items = (body as { items: PodMetric[] }).items || []
    
    // Process each pod and sum up container metrics
    const metricsInfo = items.reduce((acc: Record<string, { cpuUsage: number; memoryUsage: number; window: string; timestamp: string }>, pod: PodMetric) => {
      let totalCpu = 0
      let totalMemory = 0

      // A pod can have multiple containers reporting metrics
      if (pod.containers && Array.isArray(pod.containers)) {
        pod.containers.forEach((container) => {
          totalCpu += parseCpu(container.usage.cpu)
          totalMemory += parseMemory(container.usage.memory)
        })
      }

      acc[`${pod.metadata.namespace}/${pod.metadata.name}`] = {
        cpuUsage: totalCpu,
        memoryUsage: totalMemory,
        window: pod.window,
        timestamp: pod.timestamp
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
