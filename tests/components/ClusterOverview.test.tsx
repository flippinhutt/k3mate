import { render, screen, waitFor } from '@testing-library/react'
import { ClusterOverview } from '@/components/dashboard/ClusterOverview'

describe('ClusterOverview', () => {
  const props = {
    nodes: [{ name: 'node-1', ready: true, allocatable: { cpu: '4', memory: '8Gi' } }],
    podCount: 12,
    deploymentCount: 4,
  }

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ metrics: {} }),
      })
    ) as jest.Mock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders node count', async () => {
    render(<ClusterOverview {...props} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('renders pod count', async () => {
    render(<ClusterOverview {...props} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
