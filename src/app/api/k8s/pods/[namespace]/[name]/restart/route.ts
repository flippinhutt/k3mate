import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

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
