# Backend API follow-ups (for the dashboard)

This document captures recommended backend endpoints to support a professional RADIUS + user management dashboard, beyond what the UI can do with existing APIs.

## 1) Session drill-down richness (troubleshooting)

### 1.1 Get live session detail for a username
- **Route**: `GET /api/sessions/live/:username`
- **Goal**: support “User Detail -> Overview/Actions” with accurate NAS/session metadata.
- **Response (example)**:

```json
{
  "success": true,
  "data": {
    "username": "alice",
    "isOnline": true,
    "acctSessionId": "0x1234",
    "nasIpAddress": "172.8.16.200",
    "framedIpAddress": "10.10.10.20",
    "callingStationId": "AA-BB-CC-DD-EE-FF",
    "startTime": "2026-01-22T10:00:00.000Z",
    "lastUpdate": "2026-01-22T10:05:00.000Z",
    "sessionTimeSeconds": 300,
    "bytesIn": 123456,
    "bytesOut": 654321,
    "status": "active"
  }
}
```

### 1.2 Get recent auth failures (rejects) for a username
- **Route**: `GET /api/sessions/rejects/:username?limit=50`
- **Goal**: show “why can’t this user connect?”
- **Response (example)**:

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-01-22T09:50:00.000Z",
      "nasIpAddress": "172.8.16.200",
      "reason": "Invalid password",
      "requestId": "req_abc123"
    }
  ]
}
```

## 2) Bulk operations (avoid N requests from UI)

### 2.1 Bulk assign profile
- **Route**: `POST /api/radius/users/bulk/assign-profile`
- **Body**:

```json
{
  "usernames": ["alice", "bob"],
  "profileId": 3,
  "dryRun": true
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "dryRun": true,
    "willUpdate": 2,
    "skipped": 0,
    "errors": []
  }
}
```

### 2.2 Bulk set account status
- **Route**: `POST /api/radius/users/bulk/set-status`
- **Body**:

```json
{
  "usernames": ["alice", "bob"],
  "accountStatus": "suspended",
  "dryRun": true
}
```

### 2.3 Bulk reset MAC binding
- **Route**: `POST /api/radius/users/bulk/reset-mac`
- **Body**:

```json
{
  "usernames": ["alice", "bob"],
  "dryRun": true
}
```

## 3) Audit logs (who did what, when)

### 3.1 List audit events
- **Route**: `GET /api/audit?from=...&to=...&actor=...&target=...&limit=200`
- **Goal**: power User Detail “Activity” and admin audit exports.
- **Event shape**:

```json
{
  "id": "evt_123",
  "timestamp": "2026-01-22T10:10:00.000Z",
  "actor": { "authUserId": 10, "username": "admin1" },
  "action": "users.resetMac",
  "target": { "type": "radiusUser", "username": "alice" },
  "metadata": { "requestId": "req_abc123" }
}
```

### 3.2 Record audit events (server-side only)
- Recommended to record audit events in middleware/services (not via UI calls), using requestId correlation.\n

## Notes
- Keep consistent envelope: `{ success, message?, data }` to match existing frontend expectations.
- Prefer server-side batching for bulk operations; UI will otherwise hammer the API with N requests.

