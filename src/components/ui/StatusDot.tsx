export function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ready ? 'bg-green-400' : 'bg-red-400'}`} />
  )
}
