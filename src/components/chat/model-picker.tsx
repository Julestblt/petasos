import { useMemo, useState } from 'react'
import { Brain, Check, ChevronDown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'
import type { GatewayModel, ReasoningEffort } from '@/types/hermes'

const EFFORTS: Array<{ value: ReasoningEffort; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

interface ProviderGroup {
  key: string
  label: string
  slug: string
  models: GatewayModel[]
}

function groupByProvider(models: GatewayModel[]): ProviderGroup[] {
  const map = new Map<string, ProviderGroup>()
  for (const model of models) {
    const key = model.provider || 'unknown'
    const existing = map.get(key)
    if (existing) {
      existing.models.push(model)
      continue
    }
    map.set(key, {
      key,
      slug: key,
      label: model.provider_label?.trim() || key,
      models: [model],
    })
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function ModelPicker({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const models = useModelCatalogStore((state) => state.models)
  const modelId = useModelCatalogStore((state) => state.modelId)
  const setModelId = useModelCatalogStore((state) => state.setModelId)
  const reasoningEffort = useModelCatalogStore((state) => state.reasoningEffort)
  const setReasoningEffort = useModelCatalogStore((state) => state.setReasoningEffort)
  const selected = models.find((model) => model.id === modelId)
  const reasoningEnabled = Boolean(selected?.capabilities?.reasoning)
  const groups = useMemo(() => groupByProvider(models), [models])

  function choose(id: string) {
    setModelId(id)
    setOpen(false)
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || models.length === 0}
        onClick={() => setOpen(true)}
        className="h-8 max-w-[16rem] gap-1.5 px-2 font-normal"
      >
        <span className="min-w-0 truncate text-left">
          <span className="block truncate text-xs font-medium leading-tight">
            {selected?.model ?? 'Select model'}
          </span>
          {selected ? (
            <span className="block truncate font-mono text-[10px] leading-tight text-muted-foreground">
              {selected.id}
            </span>
          ) : null}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </Button>

      {reasoningEnabled ? (
        <Select
          value={reasoningEffort}
          onValueChange={(value) => setReasoningEffort(value as ReasoningEffort)}
          disabled={disabled}
        >
          <SelectTrigger size="sm" className="h-8 w-auto gap-1.5 border-0 bg-transparent px-2 shadow-none">
            <Brain className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Reasoning" />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectGroup>
              <SelectLabel>Reasoning</SelectLabel>
              {EFFORTS.map((effort) => (
                <SelectItem key={effort.value} value={effort.value}>
                  {effort.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : null}

      <CommandDialog open={open} onOpenChange={setOpen} title="Select model">
        <CommandInput placeholder="Search provider or model…" />
        <CommandList>
          <CommandEmpty>No models found.</CommandEmpty>
          {groups.map((group, index) => (
            <div key={group.key}>
              {index > 0 ? <CommandSeparator /> : null}
              <CommandGroup
                heading={`${group.label} · ${group.slug} · ${group.models.length}`}
              >
                {group.models.map((model) => {
                  const active = model.id === modelId
                  return (
                    <CommandItem
                      key={model.id}
                      value={`${model.provider_label} ${model.provider} ${model.model} ${model.id}`}
                      onSelect={() => choose(model.id)}
                      className="items-start py-2.5"
                    >
                      <Check
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          active ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{model.model}</span>
                          {model.capabilities?.reasoning ? (
                            <span className="inline-flex items-center gap-0.5 rounded border px-1 py-px text-[10px] text-muted-foreground">
                              <Brain className="size-2.5" />
                              reason
                            </span>
                          ) : null}
                          {model.capabilities?.fast ? (
                            <span className="inline-flex items-center gap-0.5 rounded border px-1 py-px text-[10px] text-muted-foreground">
                              <Zap className="size-2.5" />
                              fast
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {model.id}
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  )
}
