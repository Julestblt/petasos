import { useState } from 'react'
import { CornerDownRight, LoaderCircle, OctagonX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  steerActiveRun,
  stopActiveRun,
} from '@/hooks/useConversationStream'
import { useChatStore } from '@/stores/chatStore'

export function RunControls() {
  const isSending = useChatStore((state) => state.isSending)
  const activeRunId = useChatStore((state) => state.activeRunId)
  const [guidance, setGuidance] = useState('')
  const [stopping, setStopping] = useState(false)
  const [steering, setSteering] = useState(false)
  const [error, setError] = useState<string>()

  if (!isSending || !activeRunId) return null

  async function handleStop() {
    setStopping(true)
    setError(undefined)
    try {
      await stopActiveRun()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop run')
    } finally {
      setStopping(false)
    }
  }

  async function handleSteer() {
    const trimmed = guidance.trim()
    if (!trimmed || steering) return
    setSteering(true)
    setError(undefined)
    try {
      await steerActiveRun(trimmed)
      setGuidance('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to steer run')
    } finally {
      setSteering(false)
    }
  }

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium">Active run</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {activeRunId}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={stopping}
            onClick={() => void handleStop()}
          >
            {stopping ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <OctagonX className="size-4" />
            )}
            Stop
          </Button>
        </div>

        <InputGroup>
          <InputGroupInput
            value={guidance}
            onChange={(event) => setGuidance(event.target.value)}
            placeholder="Steer Hermes at the next tool boundary…"
            disabled={steering}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSteer()
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="sm"
              variant="secondary"
              disabled={steering || !guidance.trim()}
              onClick={() => void handleSteer()}
            >
              {steering ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CornerDownRight className="size-4" />
              )}
              Steer
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
