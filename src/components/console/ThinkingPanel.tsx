import { ChevronDown, Lightbulb, Terminal } from 'lucide-react'
import { useState } from 'react'
import {
  buildThinkingSteps,
  executedCommands,
  summarizeThinking,
  type ThinkingStep,
} from '@/lib/thinkingSteps'
import { cn } from '@/lib/utils'
import type { ThinkingItem } from '@/types/hermes'

export function ThinkingPanel({
  items,
  active = false,
}: {
  items: ThinkingItem[]
  active?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null

  const steps = buildThinkingSteps(items)
  const commands = executedCommands(steps)
  const summary = summarizeThinking(steps)
  const label = active ? 'Thinking' : 'Thought'

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-border/80 bg-secondary/35">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
      >
        <Lightbulb
          className={cn(
            'mt-0.5 h-3.5 w-3.5 shrink-0',
            active ? 'text-amber-400 animate-pulse' : 'text-amber-400/80',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/90">
              {label}
              {active ? '…' : ''}
            </span>
            <span className="tabular-nums opacity-60">{steps.length}</span>
            <ChevronDown
              className={cn(
                'ml-auto h-3.5 w-3.5 shrink-0 opacity-60 transition-transform',
                open && 'rotate-180',
              )}
            />
          </div>
          {!open ? (
            <div className="mt-1.5 space-y-1">
              {commands.length > 0 ? (
                commands.slice(0, 2).map((command) => (
                  <div
                    key={command}
                    className="flex min-w-0 items-baseline gap-2 font-mono text-[11px] leading-snug"
                  >
                    <span className="shrink-0 text-muted-foreground">Executed</span>
                    <span className="truncate text-foreground/85">{command}</span>
                  </div>
                ))
              ) : (
                <div className="truncate font-mono text-[11px] text-muted-foreground">
                  {summary}
                </div>
              )}
              {commands.length > 2 ? (
                <div className="text-[10px] text-muted-foreground">
                  +{commands.length - 2} more
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-border/60 px-3 py-3">
          {steps.map((step) => (
            <ThinkingStepCard key={step.id} step={step} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ThinkingStepCard({ step }: { step: ThinkingStep }) {
  const failed = step.status === 'failed'
  const running = step.status === 'running'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border',
        failed
          ? 'border-destructive/35 bg-destructive/5'
          : 'border-border/70 bg-background/40',
      )}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
        <Terminal className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="font-medium text-foreground/90">{step.toolName}</span>
        <span
          className={cn(
            'ml-auto rounded px-1.5 py-0.5 text-[10px] tabular-nums',
            failed && 'bg-destructive/15 text-destructive',
            running && 'bg-amber-400/10 text-amber-300',
            !failed && !running && 'bg-secondary text-muted-foreground',
          )}
        >
          {failed ? 'failed' : running ? 'running' : 'done'}
          {typeof step.exitCode === 'number' ? ` · ${step.exitCode}` : ''}
        </span>
      </div>

      {step.command ? (
        <div className="border-t border-border/50 px-2.5 py-2">
          <div className="mb-1 text-[10px] text-muted-foreground">Executed</div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-foreground/90">
            <span className="select-none text-muted-foreground">$ </span>
            {step.command}
          </pre>
        </div>
      ) : null}

      {!step.command && step.fields && step.fields.length > 0 ? (
        <div className="space-y-1 border-t border-border/50 px-2.5 py-2">
          {step.fields.map((field) => (
            <div
              key={field.label}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[11px]"
            >
              <span className="text-muted-foreground">{field.label}</span>
              <span className="truncate font-mono text-foreground/85">{field.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {step.error ? (
        <div className="border-t border-border/50 px-2.5 py-2 text-[11px] leading-snug text-destructive">
          {step.error}
        </div>
      ) : null}

      {step.output ? (
        <div className="border-t border-border/50">
          <div className="px-2.5 pt-2 text-[10px] text-muted-foreground">Output</div>
          <pre className="max-h-40 overflow-auto px-2.5 pb-2.5 font-mono text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {step.output.length > 2400
              ? `${step.output.slice(0, 2400)}…`
              : step.output}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
