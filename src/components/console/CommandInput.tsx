import { LoaderCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { ModelPicker } from '@/components/console/ModelPicker'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommandInputProps {
  disabled?: boolean
  onSubmit: (value: string) => Promise<unknown> | unknown
}

export function CommandInput({ disabled, onSubmit }: CommandInputProps) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)

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
      <div className="mx-auto max-w-3xl space-y-3">
        <ModelPicker disabled={disabled || pending} />
        <div className="rounded-2xl border border-border bg-card/60 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Message Hermes…"
            className="min-h-[72px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            disabled={disabled || pending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
          />
          <div className="flex items-center justify-end px-1 pb-1">
            <Button
              size="sm"
              className="rounded-full"
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
    </div>
  )
}
