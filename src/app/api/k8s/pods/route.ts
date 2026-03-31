import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

/**
 * GET handler for retrieving pods from the Kubernetes cluster.
 * Supports filtering by namespace via the 'namespace' query parameter.
 * 
 * - If 'namespace' is provided, returns all pods in that specific namespace.
 * - If 'namespace' is omitted, returns all pods across all namespaces.
 * 
 * @param {NextRequest} request The incoming HTTP request.
 * @returns {NextResponse} A JSON response containing an array of pods or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const namespace = new URL(request.url).searchParams.get('namespace') ?? undefined
    const api = getCoreV1Api()
    const result = namespace
      ? await api.listNamespacedPod({ namespace })
      : await api.listPodForAllNamespaces()

    const pods = result.items.map(pod => ({
      name: pod.metadata?.name ?? 'unknown',
      namespace: pod.metadata?.namespace ?? 'default',
      phase: pod.status?.phase ?? 'Unknown',
      podIP: pod.status?.podIP,
      nodeName: pod.spec?.nodeName,
      restartCount: pod.status?.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) ?? 0,
      ready: pod.status?.containerStatuses?.every(c => c.ready) ?? false,
      createdAt: pod.metadata?.creationTimestamp,
      ports: pod.spec?.containers?.flatMap(c => c.ports ?? []).map(p => ({
        name: p.name,
        containerPort: p.containerPort,
        protocol: p.protocol ?? 'TCP',
      })) ?? [],
      containers: pod.spec?.containers?.map(c => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })) ?? [],
    }))

    return NextResponse.json({ pods })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
