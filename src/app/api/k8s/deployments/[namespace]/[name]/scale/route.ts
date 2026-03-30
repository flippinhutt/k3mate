import { NextRequest, NextResponse } from 'next/server'
import { getAppsV1Api } from '@/lib/k8s-client'

export async function POST(
  request: NextRequest,
  { params }: { params: { namespace: string; name: string } }
) {
  try {
    const { replicas } = await request.json()
    if (typeof replicas !== 'number' || replicas < 0) {
      return NextResponse.json({ error: 'replicas must be a non-negative number' }, { status: 400 })
    }
    const api = getAppsV1Api()
    await api.patchNamespacedDeploymentScale(
      params.name,
      params.namespace,
      { spec: { replicas } },
      undefined, undefined, undefined, undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    )
    return NextResponse.json({ ok: true, replicas })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
