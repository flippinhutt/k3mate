import { getKubeConfig, getCoreV1Api, getAppsV1Api, _resetForTesting } from '@/lib/k8s-client'
import * as k8s from '@kubernetes/client-node'

jest.mock('@kubernetes/client-node')

describe('k8s-client', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    _resetForTesting()
  })

  it('loads kubeconfig from KUBECONFIG env var', () => {
    const mockLoadFromFile = jest.fn()
    const mockKubeConfig = { loadFromFile: mockLoadFromFile, makeApiClient: jest.fn() }
    ;(k8s.KubeConfig as jest.Mock).mockImplementation(() => mockKubeConfig)
    process.env.KUBECONFIG = '/fake/path'

    getKubeConfig()

    expect(mockLoadFromFile).toHaveBeenCalledWith('/fake/path')
  })

  it('returns CoreV1Api instance', () => {
    const mockMakeApiClient = jest.fn().mockReturnValue({})
    const mockKubeConfig = { loadFromFile: jest.fn(), makeApiClient: mockMakeApiClient }
    ;(k8s.KubeConfig as jest.Mock).mockImplementation(() => mockKubeConfig)

    getCoreV1Api()

    expect(mockMakeApiClient).toHaveBeenCalledWith(k8s.CoreV1Api)
  })
})
