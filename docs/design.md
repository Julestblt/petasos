# Design

Petasos is a private operator console for Hermes. One shell. One theme. No
parallel v1 / v2 chrome.

## Product

Chat is the product. The operator talks to Hermes through
`homelab-gateway`, lists conversations, and watches tool actions land in
real time. Status and skills are secondary rooms, not a second app.

The Live Orb is a companion, not a control. It sits to the left of the
operator name in the sidebar footer. Eyes follow the pointer. It never
navigates, never sends, never represents run state.

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

Type: Space Grotesk for UI, IBM Plex Mono for metrics, commands, and
stream output. Dark is the default. Light is the same tokens inverted.

UI files use kebab-case (`operator-card.tsx`, `action-stream.tsx`). Copy,
docs, and source stay English. Operator role may remain `humain` via env.

## Layout

```text
┌──────── sidebar 18rem ────────┬──────── inset ────────┐
│ Petasos                       │ trigger · title       │
│ Chat / Status / Skills        ├───────────────────────┤
│ Search + new chat             │                       │
│ Conversation list             │  Ask Hermes / stream  │
│ Quotas · host · servers       │  live actions         │
│ [orb] Jules · humain  ☀ ☾ ⚙  │  composer             │
└───────────────────────────────┴───────────────────────┘
```

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
