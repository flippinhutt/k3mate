import { NextRequest, NextResponse } from 'next/server'
import { getAppsV1Api } from '@/lib/k8s-client'

/**
 * GET handler for retrieving deployments from the Kubernetes cluster.
 * Supports filtering by namespace via the 'namespace' query parameter.
 * 
 * - If 'namespace' is provided, returns all deployments in that specific namespace.
 * - If 'namespace' is omitted, returns all deployments across all namespaces.
 * 
 * @param {NextRequest} request The incoming HTTP request.
 * @returns {NextResponse} A JSON response containing an array of deployments or an error message.
 */
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
      updatedReplicas: d.status?.updatedReplicas ?? 0,
      createdAt: d.metadata?.creationTimestamp,
      images: d.spec?.template?.spec?.containers?.map(c => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })) ?? [],
      conditions: d.status?.conditions?.map(c => ({
        type: c.type,
        status: c.status,
        reason: c.reason,
        message: c.message,
      })) ?? [],
    }))

    return NextResponse.json({ deployments })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
