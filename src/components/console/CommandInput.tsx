import { LoaderCircle, Send } from 'lucide-react'
import { useState } from 'react'
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
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask Hermes to inspect, edit, or run something in the sandbox…"
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
  )
}
