# Host metrics

Petasos can show CPU / RAM / disk for the Hermes host in the sidebar.

## What Hermes already provides

`GET /health/detailed` includes disk usage (`readiness.checks.disk.used_percent`).
It does **not** expose host CPU or RAM.

## Recommended: Glances

[Glances](https://nicolargo.github.io/glances/) exposes JSON REST metrics.

### Homelab (Tailscale)

Current private endpoint:

```text
https://homelab.tail042a16.ts.net:8443/api/4
```

Auth:

1. Prefer JWT

```http
POST /api/4/token
Content-Type: application/json

{"username":"cockpit","password":"…"}
```

Then:

```http
Authorization: Bearer <token>
```

2. Fallback: HTTP Basic Auth with the same credentials

Petasos does JWT first, caches the token, refreshes on `401`, and falls back to Basic Auth.

### Petasos `.env`

```bash
VITE_HOST_METRICS_URL=https://homelab.tail042a16.ts.net:8443/api/4
VITE_HOST_METRICS_USERNAME=cockpit
VITE_HOST_METRICS_PASSWORD=…
```

Useful endpoints:

| Path | Data |
| --- | --- |
| `GET /cpu` | `total` CPU % |
| `GET /mem` | `used` / `total` bytes |
| `GET /fs` | filesystem `%` |
| `GET /system` | hostname |

### Security note

`VITE_*` values are embedded in the frontend bundle. This is acceptable for a private Tailscale + local desktop client, but do not publish the built web assets publicly with these secrets.

## Alternatives

| Service | Format | Notes |
| --- | --- | --- |
| **Glances** | JSON REST + auth | Best fit for Petasos today |
| **Netdata** | JSON | Richer, heavier |
| **node_exporter** | Prometheus text | Needs an adapter |

Without `VITE_HOST_METRICS_URL`, Petasos falls back to Hermes disk only.
