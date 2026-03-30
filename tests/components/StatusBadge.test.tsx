import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders Running with green style', () => {
    render(<StatusBadge status="Running" />)
    const badge = screen.getByText('Running')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('green')
  })

  it('renders Failed with red style', () => {
    render(<StatusBadge status="Failed" />)
    const badge = screen.getByText('Failed')
    expect(badge.className).toContain('red')
  })
})
