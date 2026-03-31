/**
 * StatusDot renders a small, pulsing orb that indicates the 'Ready' status 
 * of a Kubernetes resource. Green indicates ready/healthy, while red 
 * indicates unready/unhealthy.
 *
 * @component
 * @param {Object} props Props for the component.
 * @param {boolean} props.ready Whether the resource is in a ready state.
 * @returns {JSX.Element} The rendered status dot.
 */
export function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      {ready && (
        <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-40 pulse-dot" />
      )}
      <span className={`relative inline-block w-2 h-2 rounded-full ${ready ? 'bg-green-400' : 'bg-red-400'}`} />
    </span>
  )
}
