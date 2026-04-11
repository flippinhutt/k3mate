'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusDot } from '@/components/ui/StatusDot'

/**
 * Represents a condition for a Deployment.
 *
 * @interface DeploymentCondition
 */
interface DeploymentCondition {
  /** The type of condition (e.g., Progressing, Available). */
  type: string
  /** The status of the condition (True, False, Unknown). */
  status: string
  /** Machine-readable reason for the condition's last transition. */
  reason?: string
  /** Human-readable message indicating details about the transition. */
  message?: string
}

/**
 * Represents a container image and its update status.
 *
 * @interface ContainerImage
 */
interface ContainerImage {
  /** The name of the container. */
  name: string
  /** The full image name (e.g., registry.com/org/repo:tag). */
  image: string
  /** Whether a newer version of the image is available. */
  hasUpdate?: boolean
  /** The tag of the latest available version. */
  latestTag?: string
  /** Whether the registry has been checked for updates. */
  checked?: boolean
}

/**
 * Represents a simplified Kubernetes Deployment object for UI display.
 *
 * @interface Deployment
 */
interface Deployment {
  /** The unique name of the deployment. */
  name: string
  /** The namespace where the deployment resides. */
  namespace: string
  /** The total number of replicas desired. */
  replicas: number
  /** The number of ready replicas currently running. */
  readyReplicas: number
  /** The number of replicas that have been updated to the latest spec. */
  updatedReplicas?: number
  /** List of container images used by this deployment. */
  images?: ContainerImage[]
  /** List of conditions representing the current state of the deployment. */
  conditions?: DeploymentCondition[]
}

/**
 * Props for the DeploymentList component.
 *
 * @interface Props
 */
interface Props {
  /** Array of deployment objects to display. */
  deployments: Deployment[]
}

/**
 * @returns {JSX.Element} The rendered deployment list.
 */
export function DeploymentList({ deployments }: Props) {
  const router = useRouter()
  const [scaling, setScaling] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  /**
   * Triggers a deployment scale action via the internal API.
   *
   * @async
   * @param {string} namespace The deployment namespace.
   * @param {string} name The deployment name.
   * @param {number} replicas The target replica count.
   * @returns {Promise<void>}
   */
  async function scale(namespace: string, name: string, replicas: number) {
    if (replicas < 0) return
    setScaling(`${namespace}/${name}`)
    try {
      await fetch(`/api/k8s/deployments/${namespace}/${name}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replicas }),
      })
      router.refresh()
    } catch (err) {
      console.error('Failed to scale deployment', err)
    }
    setScaling(null)
  }

  /**
   * Applies an image update to a specific deployment container.
   * Compares the current image with the latest tag and patches the deployment.
   *
   * @async
   * @param {string} namespace The deployment namespace.
   * @param {string} name The deployment name.
   * @param {string} containerName The name of the container within the deployment.
   * @param {string} image The current full image reference.
   * @param {string} latestTag The new tag to apply.
   * @returns {Promise<void>}
   */
  async function applyUpdate(namespace: string, name: string, containerName: string, image: string, latestTag: string) {
    const newImage = image.includes(':') 
      ? `${image.split(':')[0]}:${latestTag}` 
      : `${image}:${latestTag}`
    
    if (!confirm(`Update ${name} container "${containerName}" to ${latestTag}?`)) return

    const key = `${namespace}/${name}/${containerName}`
    setUpdating(key)
    try {
      const res = await fetch(`/api/k8s/deployments/${namespace}/${name}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerName, image: newImage }),
      })
      if (!res.ok) throw new Error('Update failed')
      router.refresh()
    } catch (err) {
      console.error('Failed to apply update', err)
      alert('Failed to apply update. See logs for details.')
    }
    setUpdating(null)
  }

  return (
    <div className="space-y-2">
      {deployments.map(dep => {
        const key = `${dep.namespace}/${dep.name}`
        const ready = dep.readyReplicas >= dep.replicas && dep.replicas > 0
        const isUpdating = dep.updatedReplicas !== undefined && dep.updatedReplicas < dep.replicas
        return (
          <div key={key} className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors duration-150">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-1.5">
                <StatusDot ready={ready} />
                <span className="font-medium text-sm text-slate-100">{dep.name}</span>
                {isUpdating && (
                  <span className="text-xs bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 px-1.5 py-0.5 rounded font-mono">
                    Updating {dep.updatedReplicas}/{dep.replicas}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono mb-1.5">{dep.namespace} · {dep.readyReplicas}/{dep.replicas} ready</div>
              {dep.images && dep.images.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dep.images.map((img, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span
                        className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]"
                        title={img.image}
                      >
                        {img.image.split('/').pop()}
                      </span>
                      {img.hasUpdate && img.latestTag && (
                        <button
                          onClick={() => applyUpdate(dep.namespace, dep.name, img.name, img.image, img.latestTag!)}
                          disabled={updating === `${dep.namespace}/${dep.name}/${img.name}`}
                          className="text-xs bg-orange-500/15 border border-orange-500/30 text-orange-400 px-1.5 py-0.5 rounded font-mono hover:bg-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                          title={`Click to update to ${img.latestTag}`}
                        >
                          {updating === `${dep.namespace}/${dep.name}/${img.name}` ? '…' : `→ ${img.latestTag}`}
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scale(dep.namespace, dep.name, dep.replicas - 1)}
                disabled={dep.replicas === 0 || scaling === key}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-colors duration-150 cursor-pointer flex items-center justify-center text-base"
              >
                −
              </button>
              <span className="text-sm w-5 text-center font-mono text-slate-200">{dep.replicas}</span>
              <button
                onClick={() => scale(dep.namespace, dep.name, dep.replicas + 1)}
                disabled={scaling === key}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-colors duration-150 cursor-pointer flex items-center justify-center text-base"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
