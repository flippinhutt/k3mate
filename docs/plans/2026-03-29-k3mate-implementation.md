# k3mate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready Next.js web app for monitoring and controlling a k3s cluster, installable as a PWA on mobile, with a responsive desktop sidebar layout.

**Architecture:** Single Next.js (App Router) service with server-side API routes that proxy calls to the k8s API via `@kubernetes/client-node`. The browser never touches k8s directly. Optional password auth via Next.js middleware + signed cookie. Deployed as a single Docker container.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, `@kubernetes/client-node`, `iron-session` (cookie auth), `bcryptjs`, Jest + React Testing Library, Docker.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

**Step 1: Scaffold Next.js project**

```bash
cd /Users/ryanhutto/projects/k3mate
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint
```

When prompted:
- Would you like to use `src/` directory? → **Yes**
- Would you like to customize the import alias? → **No** (keep `@/*`)

**Step 2: Install runtime dependencies**

```bash
npm install @kubernetes/client-node iron-session bcryptjs
npm install --save-dev @types/bcryptjs @types/node jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

**Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

**Step 4: Create `.env.example`**

```bash
# Path to kubeconfig file (required)
KUBECONFIG=/home/user/.kube/config

# Optional: enable password protection
# DASHBOARD_PASSWORD=your-password-here

# Session secret (generate with: openssl rand -hex 32)
SESSION_SECRET=change-me-to-a-random-32-char-string
```

**Step 5: Verify build works**

```bash
npm run build
```
Expected: Build completes with no errors.

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with TypeScript, Tailwind, Jest"
```

---

## Task 2: Kubernetes Client

**Files:**
- Create: `src/lib/k8s-client.ts`
- Create: `tests/lib/k8s-client.test.ts`

**Step 1: Write the failing test**

Create `tests/lib/k8s-client.test.ts`:
```typescript
import { getKubeConfig, getCoreV1Api, getAppsV1Api } from '@/lib/k8s-client'
import * as k8s from '@kubernetes/client-node'

jest.mock('@kubernetes/client-node')

describe('k8s-client', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('loads kubeconfig from KUBECONFIG env var', () => {
    const mockLoadFromFile = jest.fn()
    const mockKubeConfig = { loadFromFile: mockLoadFromFile, makeApiClient: jest.fn() }
    ;(k8s.KubeConfig as jest.Mock).mockImplementation(() => mockKubeConfig)
    process.env.KUBECONFIG = '/fake/path'

    getKubeConfig()

    expect(mockLoadFromFile).toHaveBeenCalledWith('/fake/path')
  })

  it('returns CoreV1Api instance', () => {
    const mockMakeApiClient = jest.fn().mockReturnValue({})
    const mockKubeConfig = { loadFromFile: jest.fn(), makeApiClient: mockMakeApiClient }
    ;(k8s.KubeConfig as jest.Mock).mockImplementation(() => mockKubeConfig)

    getCoreV1Api()

    expect(mockMakeApiClient).toHaveBeenCalledWith(k8s.CoreV1Api)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/lib/k8s-client.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/k8s-client'"

**Step 3: Write minimal implementation**

Create `src/lib/k8s-client.ts`:
```typescript
import * as k8s from '@kubernetes/client-node'

let kubeConfig: k8s.KubeConfig | null = null

export function getKubeConfig(): k8s.KubeConfig {
  if (kubeConfig) return kubeConfig
  kubeConfig = new k8s.KubeConfig()
  const kubeConfigPath = process.env.KUBECONFIG
  if (!kubeConfigPath) {
    throw new Error('KUBECONFIG environment variable is not set')
  }
  kubeConfig.loadFromFile(kubeConfigPath)
  return kubeConfig
}

export function getCoreV1Api(): k8s.CoreV1Api {
  return getKubeConfig().makeApiClient(k8s.CoreV1Api)
}

export function getAppsV1Api(): k8s.AppsV1Api {
  return getKubeConfig().makeApiClient(k8s.AppsV1Api)
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/lib/k8s-client.test.ts --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/k8s-client.ts tests/lib/k8s-client.test.ts
git commit -m "feat: add kubernetes client singleton"
```

---

## Task 3: Auth Middleware + Login Page

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/middleware.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `tests/lib/auth.test.ts`

**Step 1: Write the failing test**

Create `tests/lib/auth.test.ts`:
```typescript
import { checkPassword, SESSION_OPTIONS } from '@/lib/auth'
import bcrypt from 'bcryptjs'

describe('auth', () => {
  it('returns true when password matches hash', async () => {
    const hash = await bcrypt.hash('secret', 10)
    process.env.DASHBOARD_PASSWORD = hash
    expect(await checkPassword('secret')).toBe(true)
  })

  it('returns false when password does not match', async () => {
    const hash = await bcrypt.hash('secret', 10)
    process.env.DASHBOARD_PASSWORD = hash
    expect(await checkPassword('wrong')).toBe(false)
  })

  it('returns true when no DASHBOARD_PASSWORD is set (open mode)', async () => {
    delete process.env.DASHBOARD_PASSWORD
    expect(await checkPassword('anything')).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/lib/auth.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/auth'"

**Step 3: Write minimal implementation**

Create `src/lib/auth.ts`:
```typescript
import bcrypt from 'bcryptjs'
import type { IronSessionOptions } from 'iron-session'

export const SESSION_OPTIONS: IronSessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod',
  cookieName: 'k3mate_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
  },
}

export async function checkPassword(input: string): Promise<boolean> {
  const stored = process.env.DASHBOARD_PASSWORD
  if (!stored) return true // open mode
  return bcrypt.compare(input, stored)
}

export function isAuthRequired(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD)
}
```

Create `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session/edge'
import { SESSION_OPTIONS } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Skip auth for login page and auth API routes
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  if (!process.env.DASHBOARD_PASSWORD) return NextResponse.next()

  const response = NextResponse.next()
  const session = await getIronSession(request, response, SESSION_OPTIONS)

  if (!(session as { authenticated?: boolean }).authenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Create `src/app/api/auth/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { checkPassword, SESSION_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const ok = await checkPassword(password)

  if (!ok) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  const session = await getIronSession(request, response, SESSION_OPTIONS)
  ;(session as { authenticated?: boolean }).authenticated = true
  await session.save()

  return response
}
```

Create `src/app/api/auth/logout/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SESSION_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true })
  const session = await getIronSession(request, response, SESSION_OPTIONS)
  session.destroy()
  return response
}
```

Create `src/app/login/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/')
    } else {
      setError('Invalid password')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-white">k3mate</h1>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          Login
        </button>
      </form>
    </main>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/lib/auth.test.ts --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/auth.ts src/middleware.ts src/app/login/page.tsx src/app/api/auth/
git add tests/lib/auth.test.ts
git commit -m "feat: add optional password auth with iron-session middleware"
```

---

## Task 4: API Routes — Nodes

**Files:**
- Create: `src/app/api/k8s/nodes/route.ts`
- Create: `tests/api/nodes.test.ts`

**Step 1: Write the failing test**

Create `tests/api/nodes.test.ts`:
```typescript
import { GET } from '@/app/api/k8s/nodes/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/nodes', () => {
  it('returns node list from cluster', async () => {
    const mockNodes = {
      items: [
        {
          metadata: { name: 'node-1', creationTimestamp: '2024-01-01' },
          status: {
            conditions: [{ type: 'Ready', status: 'True' }],
            allocatable: { cpu: '4', memory: '8Gi' },
          },
        },
      ],
    }
    const mockApi = { listNode: jest.fn().mockResolvedValue({ body: mockNodes }) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET()
    const data = await response.json()

    expect(data.nodes).toHaveLength(1)
    expect(data.nodes[0].name).toBe('node-1')
    expect(data.nodes[0].ready).toBe(true)
  })

  it('returns 500 on k8s API error', async () => {
    const mockApi = { listNode: jest.fn().mockRejectedValue(new Error('connection refused')) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET()
    expect(response.status).toBe(500)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/nodes.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/app/api/k8s/nodes/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function GET() {
  try {
    const api = getCoreV1Api()
    const { body } = await api.listNode()
    const nodes = body.items.map(node => ({
      name: node.metadata?.name ?? 'unknown',
      ready: node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
      createdAt: node.metadata?.creationTimestamp,
      allocatable: {
        cpu: node.status?.allocatable?.cpu,
        memory: node.status?.allocatable?.memory,
      },
    }))
    return NextResponse.json({ nodes })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/nodes.test.ts --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/k8s/nodes/ tests/api/nodes.test.ts
git commit -m "feat: add /api/k8s/nodes route"
```

---

## Task 5: API Routes — Pods

**Files:**
- Create: `src/app/api/k8s/pods/route.ts`
- Create: `src/app/api/k8s/pods/[namespace]/[name]/logs/route.ts`
- Create: `src/app/api/k8s/pods/[namespace]/[name]/restart/route.ts`
- Create: `tests/api/pods.test.ts`

**Step 1: Write the failing test**

Create `tests/api/pods.test.ts`:
```typescript
import { GET } from '@/app/api/k8s/pods/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/pods', () => {
  it('returns pod list for all namespaces', async () => {
    const mockPods = {
      items: [
        {
          metadata: { name: 'pod-1', namespace: 'default', labels: {} },
          status: { phase: 'Running', podIP: '10.0.0.1', containerStatuses: [] },
          spec: { nodeName: 'node-1' },
        },
      ],
    }
    const mockApi = { listPodForAllNamespaces: jest.fn().mockResolvedValue({ body: mockPods }) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/pods'))
    const data = await response.json()

    expect(data.pods).toHaveLength(1)
    expect(data.pods[0].name).toBe('pod-1')
    expect(data.pods[0].phase).toBe('Running')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/pods.test.ts --no-coverage
```
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/app/api/k8s/pods/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function GET(request: NextRequest) {
  try {
    const namespace = request.nextUrl.searchParams.get('namespace') ?? undefined
    const api = getCoreV1Api()
    const { body } = namespace
      ? await api.listNamespacedPod(namespace)
      : await api.listPodForAllNamespaces()

    const pods = body.items.map(pod => ({
      name: pod.metadata?.name ?? 'unknown',
      namespace: pod.metadata?.namespace ?? 'default',
      phase: pod.status?.phase ?? 'Unknown',
      podIP: pod.status?.podIP,
      nodeName: pod.spec?.nodeName,
      restartCount: pod.status?.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) ?? 0,
      ready: pod.status?.containerStatuses?.every(c => c.ready) ?? false,
      createdAt: pod.metadata?.creationTimestamp,
    }))

    return NextResponse.json({ pods })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

Create `src/app/api/k8s/pods/[namespace]/[name]/logs/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { namespace: string; name: string } }
) {
  try {
    const api = getCoreV1Api()
    const { body } = await api.readNamespacedPodLog(params.name, params.namespace, undefined, false, undefined, undefined, undefined, undefined, undefined, 200)
    return NextResponse.json({ logs: body })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

Create `src/app/api/k8s/pods/[namespace]/[name]/restart/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function POST(
  _request: NextRequest,
  { params }: { params: { namespace: string; name: string } }
) {
  try {
    const api = getCoreV1Api()
    await api.deleteNamespacedPod(params.name, params.namespace)
    return NextResponse.json({ ok: true, message: `Pod ${params.name} deleted — controller will recreate it` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/pods.test.ts --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/k8s/pods/ tests/api/pods.test.ts
git commit -m "feat: add /api/k8s/pods routes with logs and restart"
```

---

## Task 6: API Routes — Deployments

**Files:**
- Create: `src/app/api/k8s/deployments/route.ts`
- Create: `src/app/api/k8s/deployments/[namespace]/[name]/scale/route.ts`
- Create: `tests/api/deployments.test.ts`

**Step 1: Write the failing test**

Create `tests/api/deployments.test.ts`:
```typescript
import { GET } from '@/app/api/k8s/deployments/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/deployments', () => {
  it('returns deployment list', async () => {
    const mockDeployments = {
      items: [
        {
          metadata: { name: 'nginx', namespace: 'default' },
          spec: { replicas: 3 },
          status: { readyReplicas: 3, availableReplicas: 3 },
        },
      ],
    }
    const mockApi = { listDeploymentForAllNamespaces: jest.fn().mockResolvedValue({ body: mockDeployments }) }
    ;(k8sClient.getAppsV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/deployments'))
    const data = await response.json()

    expect(data.deployments).toHaveLength(1)
    expect(data.deployments[0].name).toBe('nginx')
    expect(data.deployments[0].readyReplicas).toBe(3)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/deployments.test.ts --no-coverage
```
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/app/api/k8s/deployments/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAppsV1Api } from '@/lib/k8s-client'

export async function GET(request: NextRequest) {
  try {
    const namespace = request.nextUrl.searchParams.get('namespace') ?? undefined
    const api = getAppsV1Api()
    const { body } = namespace
      ? await api.listNamespacedDeployment(namespace)
      : await api.listDeploymentForAllNamespaces()

    const deployments = body.items.map(d => ({
      name: d.metadata?.name ?? 'unknown',
      namespace: d.metadata?.namespace ?? 'default',
      replicas: d.spec?.replicas ?? 0,
      readyReplicas: d.status?.readyReplicas ?? 0,
      availableReplicas: d.status?.availableReplicas ?? 0,
      createdAt: d.metadata?.creationTimestamp,
    }))

    return NextResponse.json({ deployments })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

Create `src/app/api/k8s/deployments/[namespace]/[name]/scale/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAppsV1Api } from '@/lib/k8s-client'

export async function POST(
  request: NextRequest,
  { params }: { params: { namespace: string; name: string } }
) {
  try {
    const { replicas } = await request.json()
    if (typeof replicas !== 'number' || replicas < 0) {
      return NextResponse.json({ error: 'replicas must be a non-negative number' }, { status: 400 })
    }
    const api = getAppsV1Api()
    await api.patchNamespacedDeploymentScale(
      params.name,
      params.namespace,
      { spec: { replicas } },
      undefined, undefined, undefined, undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    )
    return NextResponse.json({ ok: true, replicas })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/deployments.test.ts --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/k8s/deployments/ tests/api/deployments.test.ts
git commit -m "feat: add /api/k8s/deployments routes with scale"
```

---

## Task 7: API Route — Events

**Files:**
- Create: `src/app/api/k8s/events/route.ts`
- Create: `tests/api/events.test.ts`

**Step 1: Write the failing test**

Create `tests/api/events.test.ts`:
```typescript
import { GET } from '@/app/api/k8s/events/route'
import * as k8sClient from '@/lib/k8s-client'

jest.mock('@/lib/k8s-client')

describe('GET /api/k8s/events', () => {
  it('returns sorted event list', async () => {
    const mockEvents = {
      items: [
        {
          metadata: { name: 'evt-1', namespace: 'default' },
          involvedObject: { kind: 'Pod', name: 'pod-1' },
          reason: 'Scheduled',
          message: 'Successfully assigned',
          type: 'Normal',
          lastTimestamp: '2024-01-02T00:00:00Z',
          count: 1,
        },
      ],
    }
    const mockApi = { listEventForAllNamespaces: jest.fn().mockResolvedValue({ body: mockEvents }) }
    ;(k8sClient.getCoreV1Api as jest.Mock).mockReturnValue(mockApi)

    const response = await GET(new Request('http://localhost/api/k8s/events'))
    const data = await response.json()

    expect(data.events).toHaveLength(1)
    expect(data.events[0].reason).toBe('Scheduled')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/events.test.ts --no-coverage
```
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/app/api/k8s/events/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCoreV1Api } from '@/lib/k8s-client'

export async function GET(request: NextRequest) {
  try {
    const namespace = request.nextUrl.searchParams.get('namespace') ?? undefined
    const api = getCoreV1Api()
    const { body } = namespace
      ? await api.listNamespacedEvent(namespace)
      : await api.listEventForAllNamespaces()

    const events = body.items
      .map(e => ({
        name: e.metadata?.name ?? 'unknown',
        namespace: e.metadata?.namespace ?? 'default',
        involvedObject: {
          kind: e.involvedObject.kind,
          name: e.involvedObject.name,
        },
        reason: e.reason,
        message: e.message,
        type: e.type ?? 'Normal',
        count: e.count ?? 1,
        lastTimestamp: e.lastTimestamp ?? e.metadata?.creationTimestamp,
      }))
      .sort((a, b) => new Date(b.lastTimestamp ?? 0).getTime() - new Date(a.lastTimestamp ?? 0).getTime())
      .slice(0, 100)

    return NextResponse.json({ events })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/events.test.ts --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/k8s/events/ tests/api/events.test.ts
git commit -m "feat: add /api/k8s/events route"
```

---

## Task 8: Shared UI Components

**Files:**
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/StatusDot.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/layout/Shell.tsx`
- Create: `tests/components/StatusBadge.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/StatusBadge.test.tsx`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/components/StatusBadge.test.tsx --no-coverage
```
Expected: FAIL

**Step 3: Write implementation**

Create `src/components/ui/StatusBadge.tsx`:
```tsx
const STATUS_COLORS: Record<string, string> = {
  Running: 'bg-green-500/20 text-green-400 border-green-500/30',
  Succeeded: 'bg-green-500/20 text-green-400 border-green-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  Unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  True: 'bg-green-500/20 text-green-400 border-green-500/30',
  False: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {status}
    </span>
  )
}
```

Create `src/components/ui/StatusDot.tsx`:
```tsx
export function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ready ? 'bg-green-400' : 'bg-red-400'}`} />
  )
}
```

Create `src/components/layout/Sidebar.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/workloads', label: 'Workloads', icon: '⚙' },
  { href: '/events', label: 'Events', icon: '⚡' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 min-h-screen p-4">
      <div className="text-white font-bold text-lg mb-8 px-2">k3mate</div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

Create `src/components/layout/BottomNav.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/workloads', label: 'Workloads', icon: '⚙' },
  { href: '/events', label: 'Events', icon: '⚡' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
            pathname === item.href ? 'text-blue-400' : 'text-gray-500'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

Create `src/components/layout/Shell.tsx`:
```tsx
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/components/StatusBadge.test.tsx --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ tests/components/StatusBadge.test.tsx
git commit -m "feat: add layout shell and UI components"
```

---

## Task 9: Dashboard Page

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/dashboard/ClusterOverview.tsx`
- Create: `src/components/dashboard/NodeCard.tsx`
- Create: `tests/components/ClusterOverview.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/ClusterOverview.test.tsx`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/components/ClusterOverview.test.tsx --no-coverage
```
Expected: FAIL

**Step 3: Write implementation**

Create `src/components/dashboard/NodeCard.tsx`:
```tsx
import { StatusDot } from '@/components/ui/StatusDot'

interface NodeCardProps {
  name: string
  ready: boolean
  allocatable: { cpu?: string; memory?: string }
}

export function NodeCard({ name, ready, allocatable }: NodeCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <StatusDot ready={ready} />
          <span className="font-medium text-sm">{name}</span>
        </div>
        <div className="text-xs text-gray-500">
          CPU: {allocatable.cpu ?? '—'} · Mem: {allocatable.memory ?? '—'}
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded ${ready ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {ready ? 'Ready' : 'NotReady'}
      </span>
    </div>
  )
}
```

Create `src/components/dashboard/ClusterOverview.tsx`:
```tsx
import { NodeCard } from './NodeCard'

interface Node {
  name: string
  ready: boolean
  allocatable: { cpu?: string; memory?: string }
}

interface Props {
  nodes: Node[]
  podCount: number
  deploymentCount: number
}

export function ClusterOverview({ nodes, podCount, deploymentCount }: Props) {
  const readyNodes = nodes.filter(n => n.ready).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nodes', value: nodes.length, sub: `${readyNodes} ready` },
          { label: 'Pods', value: podCount },
          { label: 'Deployments', value: deploymentCount },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
            {stat.sub && <div className="text-xs text-gray-500 mt-1">{stat.sub}</div>}
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Nodes</h2>
        <div className="space-y-2">
          {nodes.map(node => <NodeCard key={node.name} {...node} />)}
        </div>
      </div>
    </div>
  )
}
```

Create `src/app/page.tsx`:
```tsx
import { Shell } from '@/components/layout/Shell'
import { ClusterOverview } from '@/components/dashboard/ClusterOverview'

async function getClusterData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [nodesRes, podsRes, deploymentsRes] = await Promise.all([
    fetch(`${base}/api/k8s/nodes`, { next: { revalidate: 15 } }),
    fetch(`${base}/api/k8s/pods`, { next: { revalidate: 15 } }),
    fetch(`${base}/api/k8s/deployments`, { next: { revalidate: 15 } }),
  ])
  const [{ nodes }, { pods }, { deployments }] = await Promise.all([
    nodesRes.json(),
    podsRes.json(),
    deploymentsRes.json(),
  ])
  return { nodes: nodes ?? [], podCount: pods?.length ?? 0, deploymentCount: deployments?.length ?? 0 }
}

export default async function DashboardPage() {
  const data = await getClusterData()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      <ClusterOverview {...data} />
    </Shell>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/components/ClusterOverview.test.tsx --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/ tests/components/
git commit -m "feat: add dashboard page with cluster overview"
```

---

## Task 10: Workloads Page

**Files:**
- Create: `src/app/workloads/page.tsx`
- Create: `src/components/workloads/PodList.tsx`
- Create: `src/components/workloads/DeploymentList.tsx`
- Create: `tests/components/PodList.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/PodList.test.tsx`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/components/PodList.test.tsx --no-coverage
```
Expected: FAIL

**Step 3: Write implementation**

Create `src/components/workloads/PodList.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Pod {
  name: string
  namespace: string
  phase: string
  ready: boolean
  restartCount: number
  podIP?: string
  nodeName?: string
  createdAt?: Date
}

interface Props {
  pods: Pod[]
}

export function PodList({ pods }: Props) {
  const [expandedPod, setExpandedPod] = useState<string | null>(null)
  const [logs, setLogs] = useState<Record<string, string>>({})
  const [restarting, setRestarting] = useState<string | null>(null)

  async function fetchLogs(namespace: string, name: string) {
    const key = `${namespace}/${name}`
    const res = await fetch(`/api/k8s/pods/${namespace}/${name}/logs`)
    const data = await res.json()
    setLogs(prev => ({ ...prev, [key]: data.logs ?? data.error }))
  }

  async function restartPod(namespace: string, name: string) {
    setRestarting(`${namespace}/${name}`)
    await fetch(`/api/k8s/pods/${namespace}/${name}/restart`, { method: 'POST' })
    setRestarting(null)
  }

  return (
    <div className="space-y-2">
      {pods.map(pod => {
        const key = `${pod.namespace}/${pod.name}`
        const isExpanded = expandedPod === key
        return (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-sm">{pod.name}</div>
                <div className="text-xs text-gray-500">{pod.namespace} · {pod.nodeName}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={pod.phase} />
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedPod(null)
                    } else {
                      setExpandedPod(key)
                      fetchLogs(pod.namespace, pod.name)
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
                >
                  {isExpanded ? 'Hide logs' : 'Logs'}
                </button>
                <button
                  onClick={() => restartPod(pod.namespace, pod.name)}
                  disabled={restarting === key}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  {restarting === key ? 'Restarting…' : 'Restart'}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-gray-800 bg-gray-950 p-4">
                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                  {logs[key] ?? 'Loading…'}
                </pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

Create `src/components/workloads/DeploymentList.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { StatusDot } from '@/components/ui/StatusDot'

interface Deployment {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
}

interface Props {
  deployments: Deployment[]
}

export function DeploymentList({ deployments }: Props) {
  const [scaling, setScaling] = useState<string | null>(null)

  async function scale(namespace: string, name: string, replicas: number) {
    if (replicas < 0) return
    setScaling(`${namespace}/${name}`)
    await fetch(`/api/k8s/deployments/${namespace}/${name}/scale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replicas }),
    })
    setScaling(null)
  }

  return (
    <div className="space-y-2">
      {deployments.map(dep => {
        const key = `${dep.namespace}/${dep.name}`
        const ready = dep.readyReplicas >= dep.replicas && dep.replicas > 0
        return (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusDot ready={ready} />
                <span className="font-medium text-sm">{dep.name}</span>
              </div>
              <div className="text-xs text-gray-500">{dep.namespace} · {dep.readyReplicas}/{dep.replicas} ready</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scale(dep.namespace, dep.name, dep.replicas - 1)}
                disabled={dep.replicas === 0 || scaling === key}
                className="w-7 h-7 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30 text-sm"
              >
                −
              </button>
              <span className="text-sm w-4 text-center">{dep.replicas}</span>
              <button
                onClick={() => scale(dep.namespace, dep.name, dep.replicas + 1)}
                disabled={scaling === key}
                className="w-7 h-7 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30 text-sm"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

Create `src/app/workloads/page.tsx`:
```tsx
import { Shell } from '@/components/layout/Shell'
import { PodList } from '@/components/workloads/PodList'
import { DeploymentList } from '@/components/workloads/DeploymentList'

async function getWorkloadsData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const [podsRes, deploymentsRes] = await Promise.all([
    fetch(`${base}/api/k8s/pods`, { next: { revalidate: 10 } }),
    fetch(`${base}/api/k8s/deployments`, { next: { revalidate: 10 } }),
  ])
  const [{ pods }, { deployments }] = await Promise.all([podsRes.json(), deploymentsRes.json()])
  return { pods: pods ?? [], deployments: deployments ?? [] }
}

export default async function WorkloadsPage() {
  const { pods, deployments } = await getWorkloadsData()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6">Workloads</h1>
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Deployments ({deployments.length})</h2>
        <DeploymentList deployments={deployments} />
      </section>
      <section>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Pods ({pods.length})</h2>
        <PodList pods={pods} />
      </section>
    </Shell>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/components/PodList.test.tsx --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/workloads/ src/components/workloads/ tests/components/PodList.test.tsx
git commit -m "feat: add workloads page with pod logs, restart, deployment scaling"
```

---

## Task 11: Events Page

**Files:**
- Create: `src/app/events/page.tsx`
- Create: `src/components/events/EventFeed.tsx`
- Create: `tests/components/EventFeed.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/EventFeed.test.tsx`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/components/EventFeed.test.tsx --no-coverage
```
Expected: FAIL

**Step 3: Write implementation**

Create `src/components/events/EventFeed.tsx`:
```tsx
interface Event {
  name: string
  namespace: string
  involvedObject: { kind?: string; name?: string }
  reason?: string
  message?: string
  type: string
  count: number
  lastTimestamp?: Date | string
}

export function EventFeed({ events }: { events: Event[] }) {
  return (
    <div className="space-y-2">
      {events.map(event => (
        <div
          key={event.name}
          className={`bg-gray-900 border rounded-xl p-4 ${
            event.type === 'Warning' ? 'border-yellow-500/30' : 'border-gray-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {event.type === 'Warning' && (
                  <span className="text-yellow-400 text-xs">⚠</span>
                )}
                <span className="font-medium text-sm">{event.reason}</span>
                <span className="text-xs text-gray-500">
                  {event.involvedObject.kind}/{event.involvedObject.name}
                </span>
              </div>
              <p className="text-xs text-gray-400 break-words">{event.message}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-gray-500">{event.namespace}</div>
              {event.count > 1 && (
                <div className="text-xs text-gray-600">×{event.count}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

Create `src/app/events/page.tsx`:
```tsx
import { Shell } from '@/components/layout/Shell'
import { EventFeed } from '@/components/events/EventFeed'

async function getEvents() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/k8s/events`, { next: { revalidate: 10 } })
  const { events } = await res.json()
  return events ?? []
}

export default async function EventsPage() {
  const events = await getEvents()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6">Events</h1>
      <EventFeed events={events} />
    </Shell>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/components/EventFeed.test.tsx --no-coverage
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/events/ src/components/events/ tests/components/EventFeed.test.tsx
git commit -m "feat: add events page"
```

---

## Task 12: App Layout + PWA

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `public/manifest.json`

**Step 1: Update root layout**

Edit `src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'k3mate',
  description: 'k3s cluster interface',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'k3mate',
  },
}

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
```

**Step 2: Create PWA manifest**

Create `public/manifest.json`:
```json
{
  "name": "k3mate",
  "short_name": "k3mate",
  "description": "k3s cluster interface",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#030712",
  "theme_color": "#030712",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 3: Add placeholder icons**

```bash
# Generate simple placeholder icons using node
node -e "
const { createCanvas } = require('canvas');
// If canvas not available, create minimal PNG placeholders manually
// or use any 192x192 and 512x512 PNG files named icon-192.png and icon-512.png
"
```

Note: For production, replace `public/icon-192.png` and `public/icon-512.png` with real icons. A simple approach: use any 192×192 and 512×512 PNG.

**Step 4: Verify build**

```bash
npm run build
```
Expected: Build completes with no errors.

**Step 5: Commit**

```bash
git add src/app/layout.tsx public/
git commit -m "feat: add PWA manifest and app layout"
```

---

## Task 13: Docker

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Step 1: Create Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Step 2: Enable standalone output in Next.js config**

Edit `next.config.ts` to add:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

**Step 3: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  k3mate:
    build: .
    ports:
      - "3000:3000"
    environment:
      - KUBECONFIG=/app/kubeconfig
      - SESSION_SECRET=${SESSION_SECRET}
      - DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD:-}
      - NEXT_PUBLIC_BASE_URL=http://localhost:3000
    volumes:
      - ${KUBECONFIG_HOST_PATH:-~/.kube/config}:/app/kubeconfig:ro
    restart: unless-stopped
```

**Step 4: Create .dockerignore**

Create `.dockerignore`:
```
node_modules
.next
.git
*.env
*.env.local
```

**Step 5: Build and verify**

```bash
docker build -t k3mate .
```
Expected: Image builds successfully.

**Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore next.config.ts
git commit -m "feat: add Docker build with standalone Next.js output"
```

---

## Task 14: Full Test Run + Coverage Check

**Step 1: Run all tests with coverage**

```bash
npx jest --coverage
```
Expected: All tests pass. Coverage ≥ 80% on API routes and core components.

**Step 2: Fix any coverage gaps**

If coverage is below 80% on any API route or component, add targeted tests for the missing paths (error cases, edge cases).

**Step 3: Final build verification**

```bash
npm run build
```
Expected: No errors.

**Step 4: Final commit**

```bash
git add .
git commit -m "test: verify full test suite and coverage"
```

---

## Task 15: Production Checklist

Before shipping, verify:

- [ ] `SESSION_SECRET` is set to a random 32+ char string (`openssl rand -hex 32`)
- [ ] `DASHBOARD_PASSWORD` is set if the app will be internet-facing
- [ ] kubeconfig is mounted read-only in Docker (`ro` flag)
- [ ] App is behind a reverse proxy (nginx/Traefik) with HTTPS for internet access
- [ ] `NEXT_PUBLIC_BASE_URL` is set to the actual deployed URL

**Generate a secure session secret:**
```bash
openssl rand -hex 32
```

**Hash a password for DASHBOARD_PASSWORD:**
```bash
node -e "const b = require('bcryptjs'); b.hash('yourpassword', 10).then(h => console.log(h))"
```
