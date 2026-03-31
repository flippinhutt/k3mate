# k3mate API Reference

This document provides technical details for the internal API endpoints used by the `k3mate` dashboard. All endpoints are relative to the `/api` base path.

## Kubernetes Resources

### 1. Pods
Retrieve information about pods in the cluster or specific namespaces.

- **URL**: `/api/k8s/pods`
- **Method**: `GET`
- **Query Parameters**:
  - `namespace` (optional): Filter pods by namespace.
- **Response**:
  ```json
  {
    "pods": [
      {
        "name": "string",
        "namespace": "string",
        "phase": "string",
        "podIP": "string",
        "nodeName": "string",
        "restartCount": "number",
        "ready": "boolean",
        "createdAt": "ISO8601 String",
        "ports": [{ "name": "string", "containerPort": "number", "protocol": "string" }],
        "containers": [{ "name": "string", "image": "string" }]
      }
    ]
  }
  ```

#### 1.1 Pod Logs
Stream or retrieve real-time logs for a specific pod.

- **URL**: `/api/k8s/pods/[namespace]/[name]/logs`
- **Method**: `GET`
- **Response**: `{"logs": "string"}`

#### 1.2 Pod Restart
Trigger a pod restart by deleting the pod entity.

- **URL**: `/api/k8s/pods/[namespace]/[name]/restart`
- **Method**: `POST`
- **Response**: `{"ok": true, "message": "string"}`

---

### 2. Deployments
Retrieve information about deployments and manage scaling.

- **URL**: `/api/k8s/deployments`
- **Method**: `GET`
- **Query Parameters**:
  - `namespace` (optional): Filter deployments by namespace.
- **Response**:
  ```json
  {
    "deployments": [
      {
        "name": "string",
        "namespace": "string",
        "replicas": "number",
        "readyReplicas": "number",
        "updatedReplicas": "number",
        "images": [{ "name": "string", "image": "string" }],
        "conditions": [{ "type": "string", "status": "string", "reason": "string", "message": "string" }]
      }
    ]
  }
  ```

#### 2.1 Scale Deployment
Update the replica count for a deployment.

- **URL**: `/api/k8s/deployments/[namespace]/[name]/scale`
- **Method**: `POST`
- **Body**: `{"replicas": "number"}`
- **Response**: `{"ok": true, "replicas": "number"}`

---

### 3. Nodes
Retrieve information about cluster nodes and their health.

- **URL**: `/api/k8s/nodes`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "nodes": [
      {
        "name": "string",
        "ready": "boolean",
        "createdAt": "ISO8601 String",
        "kubeletVersion": "string",
        "allocatable": {
          "cpu": "string",
          "memory": "string"
        }
      }
    ]
  }
  ```

---

### 4. Events
Retrieve the 100 most recent cluster events across all namespaces.

- **URL**: `/api/k8s/events`
- **Method**: `GET`
- **Query Parameters**:
  - `namespace` (optional): Filter events by namespace.
- **Response**:
  ```json
  {
    "events": [
      {
        "name": "string",
        "namespace": "string",
        "involvedObject": { "kind": "string", "name": "string" },
        "reason": "string",
        "message": "string",
        "type": "string",
        "count": "number",
        "lastTimestamp": "ISO8601 String"
      }
    ]
  }
  ```

---

### 5. Updates & Image Health

#### 5.1 Cluster Updates
Check for available k3s release updates.

- **URL**: `/api/k8s/updates`
- **Method**: `GET`
- **Response**: `{"hasUpdate": "boolean", "currentVersion": "string", "latestVersion": "string"}`

#### 5.2 Image Registry Check
Bulk check for available updates on Docker Hub for a list of images.

- **URL**: `/api/k8s/image-updates`
- **Method**: `POST`
- **Body**: `{"images": ["string"]}`
- **Response**: `{"updates": { "image-ref": { "hasUpdate": "boolean", "latestTag": "string", "checked": "boolean" }}}`

## Authentication

### 1. Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**: `{"password": "string"}`
- **Response**: `{"ok": true}`

---

### 2. Logout
- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Response**: `{"ok": true}`
