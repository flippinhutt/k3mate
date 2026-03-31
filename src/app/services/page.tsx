export const dynamic = 'force-dynamic'

import { Shell } from '@/components/layout/Shell'
import { ServiceList } from '@/components/services/ServiceList'

async function getServices() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/k8s/services`, { next: { revalidate: 15 } })
  const { services } = await res.json()
  return services ?? []
}

export default async function ServicesPage() {
  const services = await getServices()
  const nodePorts = services.filter((s: { ports: Array<{ nodePort?: number }> }) =>
    s.ports.some((p: { nodePort?: number }) => p.nodePort)
  )

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-1 text-slate-100">Services</h1>
      <p className="text-xs text-slate-500 mb-6">{services.length} total · {nodePorts.length} with NodePort</p>
      <ServiceList services={services} />
    </Shell>
  )
}
