const HOMELAB_IP = '192.168.50.115'

/**
 * Represents a network port for a Kubernetes Service.
 *
 * @interface ServicePort
 */
interface ServicePort {
  /** Optional name for the port. */
  name?: string
  /** The port number. */
  port: number
  /** The target port on the pods. */
  targetPort?: string
  /** The port exposed on the cluster nodes (for NodePort services). */
  nodePort?: number
  /** The network protocol (TCP, UDP). */
  protocol: string
}

/**
 * Represents a simplified Kubernetes Service object for UI display.
 *
 * @interface Service
 */
interface Service {
  /** The unique name of the service. */
  name: string
  /** The namespace where the service resides. */
  namespace: string
  /** The type of service (ClusterIP, NodePort, LoadBalancer). */
  type: string
  /** The internal cluster IP address. */
  clusterIP?: string
  /** List of ports exposed by the service. */
  ports: ServicePort[]
}

const TYPE_COLORS: Record<string, string> = {
  NodePort:     'bg-green-500/15 text-green-400 border-green-500/25',
  LoadBalancer: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  ClusterIP:    'bg-slate-500/15 text-slate-400 border-slate-500/25',
  ExternalName: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
}

/**
 * ServiceList renders a list of Kubernetes services within the cluster.
 * It identifies service types and provides clickable links for NodePort 
 * services pointing to the homelab infrastructure.
 *
 * @component
 * @param {Object} props Component props.
 * @param {Service[]} props.services Array of service objects.
 * @returns {JSX.Element} The rendered service list.
 */
export function ServiceList({ services }: { services: Service[] }) {
  return (
    <div className="space-y-2">
      {services.map(svc => {
        const key = `${svc.namespace}/${svc.name}`
        const typeColor = TYPE_COLORS[svc.type] ?? TYPE_COLORS.ClusterIP

        return (
          <div key={key} className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors duration-150">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-100">{svc.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${typeColor}`}>{svc.type}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">{svc.namespace} · {svc.clusterIP ?? '—'}</div>
              </div>
            </div>

            {svc.ports.length > 0 && (
              <div className="space-y-1.5">
                {svc.ports.map((port, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                      {port.name ? `${port.name}: ` : ''}{port.port}/{port.protocol}
                      {port.targetPort && port.targetPort !== String(port.port) ? ` → ${port.targetPort}` : ''}
                    </span>
                    {port.nodePort && (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={1.5} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <a
                          href={`http://${HOMELAB_IP}:${port.nodePort}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono bg-green-500/10 border border-green-500/25 text-green-400 hover:text-green-300 hover:bg-green-500/20 px-2 py-1 rounded transition-colors duration-150 cursor-pointer"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                          {HOMELAB_IP}:{port.nodePort}
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {svc.ports.length === 0 && (
              <p className="text-xs text-slate-600">No ports configured</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
