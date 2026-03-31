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
 * Loads the configuration from the file specified by the KUBECONFIG environment variable.
 *
 * @returns {k8s.KubeConfig} The loaded Kubernetes configuration.
 * @throws {Error} If the KUBECONFIG environment variable is not set.
 */
export function getKubeConfig(): k8s.KubeConfig {
  if (kubeConfig) return kubeConfig
  kubeConfig = new k8s.KubeConfig()
  const kubeConfigPath = process.env.KUBECONFIG
  if (!kubeConfigPath) {
    throw new Error('KUBECONFIG environment variable is not set')
  }
  kubeConfig.loadFromFile(kubeConfigPath)
  return kubeConfig
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
