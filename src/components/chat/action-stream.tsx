import { ChevronDown, LoaderCircle, Terminal } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  buildThinkingSteps,
  executedCommands,
  summarizeThinking,
  type ThinkingStep,
} from '@/lib/thinkingSteps'
import { cn } from '@/lib/utils'
import type { ThinkingItem } from '@/types/hermes'

export function ActionStream({
  items,
  active = false,
}: {
  items: ThinkingItem[]
  active?: boolean
}) {
  const [open, setOpen] = useState(active)
  const steps = buildThinkingSteps(items)
  const commands = executedCommands(steps)
  const summary = summarizeThinking(steps)

  if (items.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-3">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        {active ? (
          <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
        ) : (
          <Terminal className="size-3.5 shrink-0" />
        )}
        <span className="font-medium text-foreground">
          {active ? 'Working' : 'Actions'}
        </span>
        <span className="tabular-nums">{steps.length}</span>
        {!open ? (
          <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
            {commands[0] ?? summary}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            'ml-auto size-3.5 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-1">
        {steps.map((step) => (
          <ActionStep key={step.id} step={step} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ActionStep({ step }: { step: ThinkingStep }) {
  const failed = step.status === 'failed'
  const running = step.status === 'running'

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
        {running ? (
          <LoaderCircle className="size-3 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Terminal className="size-3 shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium">{step.toolName}</span>
        <Badge
          variant={failed ? 'destructive' : running ? 'outline' : 'secondary'}
          className="ml-auto"
        >
          {failed ? 'failed' : running ? 'running' : 'done'}
          {typeof step.exitCode === 'number' ? ` · ${step.exitCode}` : ''}
        </Badge>
      </div>

      {step.command ? (
        <pre className="border-t bg-muted/40 px-2.5 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
          <span className="select-none text-muted-foreground">$ </span>
          {step.command}
        </pre>
      ) : null}

      {!step.command && step.fields && step.fields.length > 0 ? (
        <div className="space-y-1 border-t px-2.5 py-2">
          {step.fields.map((field) => (
            <div
              key={field.label}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-[11px]"
            >
              <span className="text-muted-foreground">{field.label}</span>
              <span className="truncate font-mono">{field.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {step.error ? (
        <div className="border-t px-2.5 py-2 text-[11px] text-destructive">
          {step.error}
        </div>
      ) : null}

      {step.output ? (
        <pre className="max-h-40 overflow-auto border-t px-2.5 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {step.output.length > 2400
            ? `${step.output.slice(0, 2400)}…`
            : step.output}
        </pre>
      ) : null}
    </div>
  )
}
