import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { namespace: string; name: string } }
) {
  try {
    const api = getCoreV1Api()
    const { body } = await api.readNamespacedPodLog(
      params.name,
      params.namespace,
      undefined, false, undefined, undefined, undefined, undefined, undefined, 200
    )
    return NextResponse.json({ logs: body })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
