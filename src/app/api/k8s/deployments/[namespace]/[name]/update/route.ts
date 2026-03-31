import { NextRequest, NextResponse } from 'next/server'
import { getAppsV1Api } from '@/lib/k8s-client'

/**
 * POST handler for updating a deployment image.
 * Patches the specified container image in the target deployment.
 *
 * @async
 * @param {NextRequest} request The incoming HTTP request.
 * @param {Object} context Route context containing path parameters.
 * @param {Promise<{ namespace: string; name: string }>} context.params Path parameters.
 * @returns {Promise<NextResponse>} A JSON response indicating update success or failure.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; name: string }> }
) {
  try {
    const { namespace, name } = await params
    const { containerName, image } = (await request.json()) as { containerName: string; image: string }

    if (!containerName || !image) {
      return NextResponse.json({ error: 'containerName and image are required' }, { status: 400 })
    }

    const api = getAppsV1Api()
    
    // Using strategic merge patch to update the container image
    const patch = {
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: containerName,
                image: image
              }
            ]
          }
        }
      }
    }

    await api.patchNamespacedDeployment({
      name,
      namespace,
      body: patch
    })

    return NextResponse.json({ ok: true, containerName, image })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
