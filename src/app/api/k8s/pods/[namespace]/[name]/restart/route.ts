import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function POST(
  _request: NextRequest,
  { params }: { params: { namespace: string; name: string } }
) {
  try {
    const api = getCoreV1Api()
    await api.deleteNamespacedPod(params.name, params.namespace)
    return NextResponse.json({ ok: true, message: `Pod ${params.name} deleted — controller will recreate it` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
