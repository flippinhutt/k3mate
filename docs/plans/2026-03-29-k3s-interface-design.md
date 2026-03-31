# k3mate — k3s Interface Design

**Date:** 2026-03-29
**Status:** Approved

## Summary

A personal, mobile-and-desktop web interface for monitoring and controlling a k3s cluster. Single Next.js service with server-side Kubernetes API access, responsive Tailwind UI, and optional simple password auth.

## Goals

- Monitor cluster health, pods, deployments, nodes, and events
- Take operational actions: restart pods, scale deployments, view logs
- Work well on mobile (PWA-installable) and desktop
- Personal tool — minimal auth overhead, single deployment

## Non-Goals

- Multi-user roles/permissions
- Multi-cluster management (v1)
- Full kubectl terminal (stretch goal only)

## Architecture

```
Browser (mobile or desktop)
        │
        ▼
  Next.js App (single service, one Docker container)
  ├── /app  (React UI — Tailwind, responsive)
  └── /api  (API routes — server-side only)
             │
             ▼
     @kubernetes/client-node
             │
             ▼
     kubeconfig / KUBECONFIG env var
             │
             ▼
        k3s API server
```

- kubeconfig loaded server-side at startup — never exposed to the browser
- All k8s calls proxied through `/api/k8s/*` routes
- Deployed as a single Docker container

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** React + Tailwind CSS
- **K8s client:** `@kubernetes/client-node`
- **Auth:** Next.js middleware + signed session cookie
- **Testing:** Jest + React Testing Library
- **Container:** Docker (single image)

## Features

### Screens

| Screen | Description |
|--------|-------------|
| Dashboard | Cluster health overview — node status, pod counts, CPU/memory |
| Workloads | Deployments, pods, daemonsets — status, logs, restart, scale |
| Namespaces | Namespace selector applied globally |
| Events | Cluster events feed |

### Navigation

- **Mobile:** Bottom tab navigation
- **Desktop:** Left sidebar navigation
- Same component tree, Tailwind responsive classes handle layout

## Auth

- `DASHBOARD_PASSWORD` env var — if set, middleware requires password login
- Password check: bcrypt compare → signed session cookie (24h TTL)
- No env var set → no auth (suitable for local/VPN-only deployments)

## Configuration (env vars)

| Var | Required | Description |
|-----|----------|-------------|
| `KUBECONFIG` | Yes | Path to kubeconfig file, or inline base64 |
| `DASHBOARD_PASSWORD` | No | Enables password gate if set |

## Testing

- **Unit:** API route handlers with mocked `@kubernetes/client-node`
- **Component:** Core UI components with React Testing Library
- **Coverage target:** 80% on API routes and core components

## Deployment

Single Docker container, exposed on a chosen port. Kubeconfig mounted as a file or passed as env var. Suitable for running directly on the k3s host or on any machine with cluster access.
