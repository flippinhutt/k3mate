export const dynamic = 'force-dynamic'

import { Shell } from '@/components/layout/Shell'
import { PodList } from '@/components/workloads/PodList'
import { DeploymentList } from '@/components/workloads/DeploymentList'

interface ContainerImage { name: string; image: string }
interface ImageUpdate { hasUpdate: boolean; latestTag: string; checked: boolean }
type UpdateMap = Record<string, ImageUpdate>

async function getImageUpdates(images: string[], base: string): Promise<UpdateMap> {
  try {
    const res = await fetch(`${base}/api/k8s/image-updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
      next: { revalidate: 43200 },
    })
    if (!res.ok) return {}
    const { updates } = await res.json()
    return updates ?? {}
  } catch {
    return {}
  }
}

function mergeUpdates(images: ContainerImage[], updates: UpdateMap): (ContainerImage & Partial<ImageUpdate>)[] {
  return images.map(img => ({ ...img, ...(updates[img.image] ?? {}) }))
}

async function getWorkloadsData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [podsRes, deploymentsRes] = await Promise.all([
    fetch(`${base}/api/k8s/pods`, { next: { revalidate: 10 } }),
    fetch(`${base}/api/k8s/deployments`, { next: { revalidate: 10 } }),
  ])
  const [{ pods }, { deployments }] = await Promise.all([podsRes.json(), deploymentsRes.json()])

  const safePods = pods ?? []
  const safeDeployments = deployments ?? []

  // Collect all unique images from pods and deployments
  const podImages: string[] = safePods.flatMap((p: { containers?: ContainerImage[] }) =>
    (p.containers ?? []).map((c: ContainerImage) => c.image)
  )
  const depImages: string[] = safeDeployments.flatMap((d: { images?: ContainerImage[] }) =>
    (d.images ?? []).map((c: ContainerImage) => c.image)
  )
  const allImages = [...new Set([...podImages, ...depImages])]

  const updates = await getImageUpdates(allImages, base)

  const enrichedPods = safePods.map((pod: { containers?: ContainerImage[] } & object) => ({
    ...pod,
    containers: mergeUpdates(pod.containers ?? [], updates),
  }))

  const enrichedDeployments = safeDeployments.map((dep: { images?: ContainerImage[] } & object) => ({
    ...dep,
    images: mergeUpdates(dep.images ?? [], updates),
  }))

  return { pods: enrichedPods, deployments: enrichedDeployments }
}

export default async function WorkloadsPage() {
  const { pods, deployments } = await getWorkloadsData()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6 text-slate-100">Workloads</h1>
      <section className="mb-8">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Deployments ({deployments.length})</h2>
        <DeploymentList deployments={deployments} />
      </section>
      <section>
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Pods ({pods.length})</h2>
        <PodList pods={pods} />
      </section>
    </Shell>
  )
}
