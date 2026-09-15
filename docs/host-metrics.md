# Host metrics

Petasos can show CPU / RAM / disk for the Hermes host in the sidebar.

## What Hermes already provides

`GET /health/detailed` includes disk usage (`readiness.checks.disk.used_percent`).
It does **not** expose host CPU or RAM.

## Recommended service

Expose a tiny JSON endpoint on the host (or behind the same Tailscale URL), for example:

```http
GET /metrics/host
```

```json
{
  "name": "homelab",
  "online": true,
  "cpuPercent": 29,
  "ramUsedGb": 12,
  "ramTotalGb": 64,
  "diskPercent": 56,
  updatedAt": "2026-09-15T20:00:00.000Z"
}
```

Point Petasos at it:

```bash
VITE_HOST_METRICS_URL=https://homelab.tail042a16.ts.net/metrics/host
```

Without that URL, Petasos falls back to Hermes disk only and shows CPU/RAM as unavailable.

## Implementation options

- Small Go/Python sidecar next to Hermes reading `/proc` + disk stats
- `node_exporter` + a thin JSON adapter
- Existing monitoring stack (Netdata / Glances) with a custom JSON route
