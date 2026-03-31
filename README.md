# k3mate: Personalized Kubernetes Dashboard

**A lightweight, secure web interface for managing k3s clusters and workloads.**

k3mate is a Next.js-powered dashboard designed to provide a clean, mobile-responsive view of your Kubernetes infrastructure. It focuses on the essentials: node health, workload status, and real-time pod logs.

## 🚀 Key Features

-   **Cluster Overview**: Real-time visualization of node health, resource pressure, and k8s versioning.
-   **Workload Management**: Live list of Deployments, Pods, and Namespaces.
-   **Terminal Logs**: Stream logs directly from pods within the web interface.
-   **Pod Lifecycle**: Quick actions to restart or delete pods for troubleshooting.
-   **Secure Authentication**: Token-based access to the Kubernetes control plane.

## 🏗 Tech Stack

-   **Framework**: Next.js 15+ (App Router)
-   **Language**: TypeScript
-   **API Client**: `@kubernetes/client-node`
-   **Styling**: TailwindCSS & Radix UI / Shadcn
-   **Testing**: Vitest & React Testing Library

## 📂 Project Structure

-   **`src/app/`**: Next.js App Router pages and API routes.
-   **`src/components/`**: Modular UI components (Dashboard, Workloads, Events).
-   **`src/lib/`**: Core logic (K8s API client factory, Auth logic).
-   **`tests/`**: Comprehensive API and component test suite.

## 🛠 Getting Started

### Prerequisites
-   A running k3s or Kubernetes cluster.
-   A valid `KUBECONFIG` file.

#### Environment Variables
Create a `.env.local` file in the root:
```bash
# Path to your kubeconfig file (required)
KUBECONFIG=/path/to/your/kubeconfig.yaml

# Secret for session encryption (required, 32+ chars)
SESSION_SECRET=your_random_32_char_secret_here

# Optional: Set a password to protect the dashboard
# DASHBOARD_PASSWORD=your_secure_password
```

### Development
```bash
npm install
npm run dev
```

## 📖 Documentation

- **[Technical API Reference](file:///Users/ryanhutto/projects/k3mate/docs/API.md)**: Detailed documentation of all internal API endpoints.
- **[Architecture & Security](file:///Users/ryanhutto/projects/k3mate/CLAUDE.md)**: Project-specific rules, architecture, and security guidelines.
- **Testing Guide**: Refer to files in `tests/` for implementation examples.

---

## 🛠 Internal Architecture & API

This section provides a technical overview of the `k3mate` internal API and its integration with the Kubernetes control plane.

### Core Component: `Kubernetes API Client` (src/lib/k8s-client.ts)

The client factory provides a centralized way to initialize and retrieve typed Kubernetes API clients using the `@kubernetes/client-node` library.

- **`getKubeConfig()`**: A singleton factory for the `KubeConfig` object. Requires the `KUBECONFIG` environment variable.
- **`getCoreV1Api()`**: Returns the `CoreV1Api` for cluster-level resources (Nodes, Pods, Namespaces).
- **`getAppsV1Api()`**: Returns the `AppsV1Api` for higher-level workloads (Deployments).

### Server-Side API Routes (src/app/api/)

All routes are implemented as standard Next.js Route Handlers.

- **Workload API (`/api/k8s/deployments/`)**: Lists all deployments in the cluster.
- **Pods API (`/api/k8s/pods/[namespace]/[name]/`)**:
    - `logs/route.ts`: Streams real-time pod logs using the `readNamespacedPodLog` client method.
    - `restart/route.ts`: Triggers a pod restart by deleting the pod entity.

### Component Architecture (src/components/)

- **Dashboard**: `ClusterOverview.tsx` manages the primary health indicators.
- **Workloads**: `DeploymentList.tsx` and `PodList.tsx` use React hooks to fetch data from the server-side API routes.
- **Layout**: `Shell.tsx` provides the responsive container and navigation.
