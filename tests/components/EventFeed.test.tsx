import { render, screen } from '@testing-library/react'
import { EventFeed } from '@/components/events/EventFeed'

describe('EventFeed', () => {
  const events = [
    {
      name: 'evt-1',
      namespace: 'default',
      involvedObject: { kind: 'Pod', name: 'nginx-1' },
      reason: 'Scheduled',
      message: 'Successfully assigned',
      type: 'Normal',
      count: 1,
      lastTimestamp: '2024-01-01T00:00:00Z',
    },
  ]

  it('renders event reason', () => {
    render(<EventFeed events={events} />)
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
  })

  it('renders involved object name', () => {
    render(<EventFeed events={events} />)
    expect(screen.getByText(/nginx-1/)).toBeInTheDocument()
  })
})
