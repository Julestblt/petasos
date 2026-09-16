# Host metrics

Petasos shows CPU / RAM / disk from the homelab gateway.

## Endpoint

```http
GET https://homelab.tail042a16.ts.net/v1/metrics/overview
Authorization: Bearer <GATEWAY_API_KEY>
```

The gateway reads Glances API v4 (`status`, `cpu`, `mem`, `fs`, `network`) on
loopback and returns:

```json
{
  "data": { "cpu": { "total": 12.5 }, "mem": { "used": 1, "total": 2 }, "fs": [] },
  "unavailable": []
}
```

Glances credentials never leave the gateway process. Petasos does not call
Glances directly.

## Petasos `.env`

```bash
VITE_GATEWAY_BASE_URL=https://homelab.tail042a16.ts.net
GATEWAY_API_KEY=…
```

Do not set `VITE_HOST_METRICS_*`. Those legacy variables are removed.
