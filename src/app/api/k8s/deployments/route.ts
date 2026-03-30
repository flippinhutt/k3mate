import { NextRequest, NextResponse } from 'next/server'
import { getAppsV1Api } from '@/lib/k8s-client'

export async function GET(request: NextRequest) {
  try {
    const namespace = new URL(request.url).searchParams.get('namespace') ?? undefined
    const api = getAppsV1Api()
    const result = namespace
      ? await api.listNamespacedDeployment({ namespace })
      : await api.listDeploymentForAllNamespaces()

    const deployments = result.items.map(d => ({
      name: d.metadata?.name ?? 'unknown',
      namespace: d.metadata?.namespace ?? 'default',
      replicas: d.spec?.replicas ?? 0,
      readyReplicas: d.status?.readyReplicas ?? 0,
      availableReplicas: d.status?.availableReplicas ?? 0,
      createdAt: d.metadata?.creationTimestamp,
    }))

    return NextResponse.json({ deployments })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
