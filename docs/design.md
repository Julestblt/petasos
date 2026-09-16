# Design

Petasos is a private operator console for Hermes. One shell. One theme. No
parallel v1 / v2 chrome.

## Product

Chat is the product. The operator talks to Hermes through
`homelab-gateway`, lists conversations, and watches tool actions land in
real time. Status and skills are secondary rooms, not a second app.

GazeHero is a companion, not a control. It sits left of the operator
name in the sidebar footer. Eyes follow the pointer. Gaze state maps to
Hermes: `thinking` while a turn streams, brief `success` on finish,
`attention` while loading history, otherwise `idle`. It never navigates.

## Visual system

Everything visible is a shadcn primitive or a thin composition of those
primitives. Color, radius, and type come from `src/index.css` CSS
variables mapped into Tailwind `@theme inline`. Do not invent one-off
surfaces, hex accents, or custom buttons when a registry component exists.

| Token | Role |
| --- | --- |
| `--background` / `--foreground` | Canvas and copy |
| `--sidebar*` | Operator rail |
| `--primary` | User bubbles, send, active chrome |
| `--muted` | Telemetry, captions, action output |
| `--destructive` | Failures and deny |

Type: Syne for display / brand titles, IBM Plex Sans for UI, IBM Plex
Mono for metrics, commands, and stream output. The sidebar brand mark
is oversized relative to chrome so the petasos mark reads as identity,
not a favicon. Dark is the default. Light is the same tokens inverted.

UI files use kebab-case (`operator-card.tsx`, `action-stream.tsx`). Copy,
docs, and source stay English. Operator role may remain `humain` via env.

## Layout

```text
┌──────── sidebar ────────┬──────── inset ────────┐
│ Petasos          [⟨]    │ [⟩] title             │
│ Search + new chat       ├───────────────────────┤
│ Conversation list       │  Ask Hermes / stream  │
│ Quotas · host · servers │  live actions         │
│ [orb] Jules · humain    │  composer             │
└─────────────────────────┴───────────────────────┘
```

Sidebar primary nav lists Status, Skills, and future rooms via
`SIDEBAR_NAV`. Conversations fill the scrollable middle. Status and
Skills are no longer buried in the operator settings menu. The Skills
room is a catalog: Hermes-installed skills from `GET /v1/hermes/skills`
grouped by category, with search and filters. Overview fields only
(name / description / category). Bodies stay read-only; there is no
generic filesystem access through the gateway.

Sidebar footer matches the dense HUD the operator already uses: quota
meters, a single gateway host, service counts, then identity. Chat is a
max-width column with user pills, a live action timeline, and an
InputGroup composer.

## Chat stream

Hermes turns arrive over SSE. The UI maps:

- `assistant.delta` → markdown bubble + caret
- `tool.*` → `ActionStream` (open while the turn is live)
- `approval.request` → dialog (`once` / `session` / `always` / `deny`)

Do not hide running tools behind a collapsed “thinking” label. The
operator should see the command as it starts.

## Non-goals

- Direct calls to Hermes, Glances, or usage exporters
- Secrets in `VITE_*`
- Decorative motion that is not the orb gaze / blink
- A second design language beside shadcn
