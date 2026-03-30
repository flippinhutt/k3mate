import { render, screen } from '@testing-library/react'
import { ClusterOverview } from '@/components/dashboard/ClusterOverview'

describe('ClusterOverview', () => {
  const props = {
    nodes: [{ name: 'node-1', ready: true, allocatable: { cpu: '4', memory: '8Gi' } }],
    podCount: 12,
    deploymentCount: 4,
  }

  it('renders node count', () => {
    render(<ClusterOverview {...props} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders pod count', () => {
    render(<ClusterOverview {...props} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
