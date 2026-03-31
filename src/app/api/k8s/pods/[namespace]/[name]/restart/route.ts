import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

/**
 * POST handler for restarting a Kubernetes pod.
 * Triggers a restart by deleting the pod; the controller (e.g., ReplicaSet)
 * is responsible for creating a replacement.
 *
 * @param {NextRequest} _request The incoming HTTP request (unused).
 * @param {Object} context Route context containing path parameters.
 * @param {Promise<{ namespace: string; name: string }>} context.params Path parameters.
 * @returns {Promise<NextResponse>} A JSON response indicating if the restart was triggered.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ namespace: string; name: string }> }
) {
  try {
    const { namespace, name } = await params
    const api = getCoreV1Api()
    await api.deleteNamespacedPod({ name, namespace })
    return NextResponse.json({ ok: true, message: `Pod ${name} deleted — controller will recreate it` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
