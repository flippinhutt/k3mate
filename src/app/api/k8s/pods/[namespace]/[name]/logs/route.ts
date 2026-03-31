import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

/**
 * GET handler for retrieving pod logs.
 * Fetches the last 200 lines of logs for the specified pod.
 *
 * @param {NextRequest} _request The incoming HTTP request (unused).
 * @param {Object} context Route context containing path parameters.
 * @param {Promise<{ namespace: string; name: string }>} context.params Path parameters.
 * @returns {Promise<NextResponse>} A JSON response containing the logs string.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ namespace: string; name: string }> }
) {
  try {
    const { namespace, name } = await params
    const api = getCoreV1Api()
    const logs = await api.readNamespacedPodLog({ name, namespace, tailLines: 200 })
    return NextResponse.json({ logs })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
