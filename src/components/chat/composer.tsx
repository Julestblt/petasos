import { LoaderCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { ModelPicker } from '@/components/chat/model-picker'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'

interface ComposerProps {
  disabled?: boolean
  onSubmit: (value: string) => Promise<unknown> | unknown
}

export function Composer({ disabled, onSubmit }: ComposerProps) {
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
    <div className="bg-background px-4 pb-4">
      <div className="mx-auto max-w-3xl space-y-2">
        <ModelPicker disabled={disabled || pending} />
        <InputGroup className="has-[>textarea]:min-h-[5.5rem]">
          <InputGroupTextarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Message Hermes…"
            disabled={disabled || pending}
            className="min-h-[72px] px-3"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
          />
          <InputGroupAddon align="block-end" className="justify-end border-t">
            <InputGroupButton
              size="sm"
              variant="default"
              disabled={disabled || pending || !value.trim()}
              onClick={() => void handleSubmit()}
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}
