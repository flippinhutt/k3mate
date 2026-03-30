import { Shell } from '@/components/layout/Shell'
import { PodList } from '@/components/workloads/PodList'
import { DeploymentList } from '@/components/workloads/DeploymentList'

async function getWorkloadsData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [podsRes, deploymentsRes] = await Promise.all([
    fetch(`${base}/api/k8s/pods`, { next: { revalidate: 10 } }),
    fetch(`${base}/api/k8s/deployments`, { next: { revalidate: 10 } }),
  ])
  const [{ pods }, { deployments }] = await Promise.all([podsRes.json(), deploymentsRes.json()])
  return { pods: pods ?? [], deployments: deployments ?? [] }
}

export default async function WorkloadsPage() {
  const { pods, deployments } = await getWorkloadsData()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6">Workloads</h1>
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Deployments ({deployments.length})</h2>
        <DeploymentList deployments={deployments} />
      </section>
      <section>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Pods ({pods.length})</h2>
        <PodList pods={pods} />
      </section>
    </Shell>
  )
}
