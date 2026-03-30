import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

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
    }))

    return NextResponse.json({ pods })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
