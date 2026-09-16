import { LoaderCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useModelModeStore } from '@/stores/modelModeStore'
import type { ModelMode } from '@/types/hermes'

interface CommandInputProps {
  disabled?: boolean
  onSubmit: (value: string) => Promise<unknown> | unknown
}

export function CommandInput({ disabled, onSubmit }: CommandInputProps) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const mode = useModelModeStore((state) => state.mode)
  const modes = useModelModeStore((state) => state.modes)
  const setMode = useModelModeStore((state) => state.setMode)

  async function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled || pending) return

    setPending(true)
    try {
      await onSubmit(trimmed)
      setValue('')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="border-t border-border/80 bg-background/80 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.description}
              disabled={disabled || pending}
              onClick={() => setMode(item.id as ModelMode)}
              className={cn(
                'border px-2.5 py-1 text-[11px] transition-colors',
                mode === item.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ask the homelab agent to inspect, edit, or run something…"
            className="min-h-[72px] resize-none"
            disabled={disabled || pending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
          />
          <Button
            size="lg"
            onClick={() => void handleSubmit()}
            disabled={disabled || pending || !value.trim()}
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
