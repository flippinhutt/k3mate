/**
 * Parses a Kubernetes CPU string into a numeric millicore value.
 * e.g., "100m" -> 100, "1" -> 1000
 *
 * @param {string} cpuCpu String representation of CPU from Kubernetes (e.g. "100m", "1.5").
 * @returns {number} The CPU value in millicores (m).
 */
export function parseCpu(cpuStr?: string | null): number {
  if (!cpuStr) return 0
  if (cpuStr.endsWith('m')) {
    return parseInt(cpuStr.slice(0, -1), 10)
  }
  // If it's a raw number or float (e.g. "1" or "1.5"), convert to millicores
  return Math.round(parseFloat(cpuStr) * 1000)
}

/**
 * Parses a Kubernetes Memory string into a numeric bytes value.
 * e.g., "500Mi" -> 524288000, "1Gi" -> 1073741824
 *
 * @param {string} memStr String representation of Memory from Kubernetes (e.g. "500Mi").
 * @returns {number} The memory value in bytes.
 */
export function parseMemory(memStr?: string | null): number {
  if (!memStr) return 0
  const match = memStr.match(/^(\d+)([KMGTP]i|[KMGTP]|)$/i)
  if (!match) return parseInt(memStr, 10) || 0

  const val = parseFloat(match[1])
  const suffix = match[2].toUpperCase()

  const multipliers: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    P: 1e15,
    KI: 1024,
    MI: Math.pow(1024, 2),
    GI: Math.pow(1024, 3),
    TI: Math.pow(1024, 4),
    PI: Math.pow(1024, 5),
  }

  return Math.round(val * (multipliers[suffix] || 1))
}
