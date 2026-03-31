import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function GET(request: NextRequest) {
  try {
    const namespace = new URL(request.url).searchParams.get('namespace') ?? undefined
    const api = getCoreV1Api()
    const result = namespace
      ? await api.listNamespacedService({ namespace })
      : await api.listServiceForAllNamespaces()

    const services = result.items.map(svc => ({
      name: svc.metadata?.name ?? 'unknown',
      namespace: svc.metadata?.namespace ?? 'default',
      type: svc.spec?.type ?? 'ClusterIP',
      clusterIP: svc.spec?.clusterIP,
      ports: svc.spec?.ports?.map(p => ({
        name: p.name,
        port: p.port,
        targetPort: p.targetPort !== undefined ? String(p.targetPort) : undefined,
        nodePort: p.nodePort,
        protocol: p.protocol ?? 'TCP',
      })) ?? [],
    }))

    return NextResponse.json({ services })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
