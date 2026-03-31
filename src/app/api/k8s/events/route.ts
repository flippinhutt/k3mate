import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

/**
 * GET handler for retrieving recent cluster events.
 * Supports filtering by namespace via the 'namespace' query parameter.
 * Returns the 100 most recent events sorted by timestamp.
 * 
 * @param {NextRequest} request The incoming HTTP request.
 * @returns {Promise<NextResponse>} A JSON response containing an array of cluster events.
 */
export async function GET(request: NextRequest) {
  try {
    const namespace = new URL(request.url).searchParams.get('namespace') ?? undefined
    const api = getCoreV1Api()
    const result = namespace
      ? await api.listNamespacedEvent({ namespace })
      : await api.listEventForAllNamespaces()

    const events = result.items
      .map(e => ({
        name: e.metadata?.name ?? 'unknown',
        namespace: e.metadata?.namespace ?? 'default',
        involvedObject: {
          kind: e.involvedObject.kind,
          name: e.involvedObject.name,
        },
        reason: e.reason,
        message: e.message,
        type: e.type ?? 'Normal',
        count: e.count ?? 1,
        lastTimestamp: e.lastTimestamp ?? e.metadata?.creationTimestamp,
      }))
      .sort((a, b) => new Date(b.lastTimestamp ?? 0).getTime() - new Date(a.lastTimestamp ?? 0).getTime())
      .slice(0, 100)

    return NextResponse.json({ events })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
