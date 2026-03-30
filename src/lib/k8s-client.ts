import * as k8s from '@kubernetes/client-node'

let kubeConfig: k8s.KubeConfig | null = null

export function _resetForTesting(): void {
  kubeConfig = null
}

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

export function getCoreV1Api(): k8s.CoreV1Api {
  return getKubeConfig().makeApiClient(k8s.CoreV1Api)
}

export function getAppsV1Api(): k8s.AppsV1Api {
  return getKubeConfig().makeApiClient(k8s.AppsV1Api)
}
