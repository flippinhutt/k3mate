import { render, screen } from '@testing-library/react'
import { PodList } from '@/components/workloads/PodList'

describe('PodList', () => {
  const pods = [
    { name: 'nginx-abc', namespace: 'default', phase: 'Running', ready: true, restartCount: 0, podIP: '10.0.0.1', nodeName: 'node-1', createdAt: undefined },
  ]

  it('renders pod name', () => {
    render(<PodList pods={pods} />)
    expect(screen.getByText('nginx-abc')).toBeInTheDocument()
  })

  it('renders Running status badge', () => {
    render(<PodList pods={pods} />)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
