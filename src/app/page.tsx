export const dynamic = 'force-dynamic'

import { Shell } from '@/components/layout/Shell'
import { ClusterOverview } from '@/components/dashboard/ClusterOverview'

async function getClusterData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [nodesRes, podsRes, deploymentsRes] = await Promise.all([
    fetch(`${base}/api/k8s/nodes`, { next: { revalidate: 15 } }),
    fetch(`${base}/api/k8s/pods`, { next: { revalidate: 15 } }),
    fetch(`${base}/api/k8s/deployments`, { next: { revalidate: 15 } }),
  ])
  const [{ nodes }, { pods }, { deployments }] = await Promise.all([
    nodesRes.json(),
    podsRes.json(),
    deploymentsRes.json(),
  ])
  return { nodes: nodes ?? [], podCount: pods?.length ?? 0, deploymentCount: deployments?.length ?? 0 }
}

export default async function DashboardPage() {
  const data = await getClusterData()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6 text-slate-100">Dashboard</h1>
      <ClusterOverview {...data} />
    </Shell>
  )
}
