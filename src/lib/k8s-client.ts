import * as k8s from '@kubernetes/client-node'

let kubeConfig: k8s.KubeConfig | null = null

/**
 * Resets the cached KubeConfig object.
 * Primarily used in test suites to ensure a clean state between tests.
 */
export function _resetForTesting(): void {
  kubeConfig = null
}

/**
 * Initializes and retrieves the singleton KubeConfig object.
 * First checks to see if k3mate is running within a Kubernetes pod using 
 * `loadFromCluster`. If not available, it attempts to load from the 
 * `KUBECONFIG` environment variable, or finally `loadFromDefault`.
 *
 * @returns {k8s.KubeConfig} The loaded Kubernetes configuration.
 */
export function getKubeConfig(): k8s.KubeConfig {
  if (kubeConfig) return kubeConfig
  kubeConfig = new k8s.KubeConfig()

  const kubeConfigPath = process.env.KUBECONFIG
  
  try {
    if (kubeConfigPath) {
      kubeConfig.loadFromFile(kubeConfigPath)
    } else {
      // loadFromDefault() handles KUBECONFIG environment variable first,
      // then falls back to ~/.kube/config, then finally to loadFromCluster().
      kubeConfig.loadFromDefault()
      
      // If none of those yielded a valid cluster, try loadFromCluster explicitly
      // as a safety fallback (though loadFromDefault usually covers it).
      if (kubeConfig.contexts.length === 0) {
        kubeConfig.loadFromCluster()
      }
    }
    return kubeConfig
  } catch (err) {
    // If all else fails, try loadFromCluster one last time or throw
    try {
      kubeConfig.loadFromCluster()
      return kubeConfig
    } catch {
      // Re-throw the original error if even cluster-auth fails
      throw err
    }
  }
}

/**
 * Creates and returns an instance of the Kubernetes CustomObjectsApi.
 * Useful for fetching data from the metrics.k8s.io aggregated API.
 *
 * @returns {k8s.CustomObjectsApi} The CustomObjects API client.
 */
export function getCustomObjectsApi(): k8s.CustomObjectsApi {
  return getKubeConfig().makeApiClient(k8s.CustomObjectsApi)
}

/**
 * Creates and returns an instance of the Kubernetes CoreV1Api.
 * Used for managing nodes, namespaces, pods, and services.
 *
 * @returns {k8s.CoreV1Api} The CoreV1 API client.
 */
export function getCoreV1Api(): k8s.CoreV1Api {
  return getKubeConfig().makeApiClient(k8s.CoreV1Api)
}

/**
 * Creates and returns an instance of the Kubernetes AppsV1Api.
 * Used for managing deployments, statefulsets, and daemonsets.
 *
 * @returns {k8s.AppsV1Api} The AppsV1 API client.
 */
export function getAppsV1Api(): k8s.AppsV1Api {
  return getKubeConfig().makeApiClient(k8s.AppsV1Api)
}
