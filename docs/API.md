# k3mate API Reference

This document provides technical details for the internal API endpoints used by the `k3mate` dashboard. All endpoints are relative to the `/api` base path.

## Kubernetes Resources

### 1. Pods
Retrieve information about pods in the cluster.

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
        "createdAt": "ISO8601 String"
      }
    ]
  }
  ```

---

### 2. Deployments
Retrieve information about deployments in the cluster.

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
        "availableReplicas": "number",
        "createdAt": "ISO8601 String"
      }
    ]
  }
  ```

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
Retrieve the 100 most recent cluster events.

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
        "involvedObject": {
          "kind": "string",
          "name": "string"
        },
        "reason": "string",
        "message": "string",
        "type": "string",
        "count": "number",
        "lastTimestamp": "ISO8601 String"
      }
    ]
  }
  ```

## Authentication

### 1. Login
Authenticate with the dashboard.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "password": "string"
  }
  ```
- **Response**:
  - `200 OK`: `{"success": true}`
  - `401 Unauthorized`: `{"error": "Invalid password"}`

---

### 2. Logout
Clear the current session.

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Response**:
  - `200 OK`: `{"success": true}`

---

### 3. Session Status
Check if the current session is authenticated.

- **URL**: `/api/auth/session`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "authenticated": "boolean"
  }
  ```
