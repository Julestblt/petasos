import { useMemo } from 'react'
import { Brain, Sparkles } from 'lucide-react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModelCatalogStore } from '@/stores/modelCatalogStore'
import type { ReasoningEffort } from '@/types/hermes'

const EFFORTS: Array<{ value: ReasoningEffort; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function ModelPicker({ disabled }: { disabled?: boolean }) {
  const models = useModelCatalogStore((state) => state.models)
  const modelId = useModelCatalogStore((state) => state.modelId)
  const setModelId = useModelCatalogStore((state) => state.setModelId)
  const reasoningEffort = useModelCatalogStore((state) => state.reasoningEffort)
  const setReasoningEffort = useModelCatalogStore((state) => state.setReasoningEffort)
  const selected = models.find((model) => model.id === modelId)
  const reasoningEnabled = Boolean(selected?.capabilities?.reasoning)

  const items = useMemo(() => models.map((model) => model.id), [models])
  const modelById = useMemo(
    () => new Map(models.map((model) => [model.id, model])),
    [models],
  )

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Combobox
        items={items}
        value={modelId ?? null}
        onValueChange={(value) => {
          if (typeof value === 'string' && value.length > 0) {
            setModelId(value)
          }
        }}
        itemToStringLabel={(id) => {
          const model = modelById.get(String(id))
          if (!model) return String(id)
          return model.model
        }}
        disabled={disabled || models.length === 0}
      >
        <div className="flex min-w-[12rem] max-w-[18rem] items-center gap-1.5">
          <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
          <ComboboxInput
            placeholder="Search models…"
            disabled={disabled || models.length === 0}
            className="h-8 min-w-0 flex-1 bg-transparent"
            showClear
          />
        </div>
        <ComboboxContent className="w-[min(20rem,var(--available-width))]">
          <ComboboxEmpty>No models found.</ComboboxEmpty>
          <ComboboxList>
            {(id) => {
              const model = modelById.get(String(id))
              if (!model) return null
              return (
                <ComboboxItem key={model.id} value={model.id}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{model.model}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {model.provider_label}
                    </div>
                  </div>
                </ComboboxItem>
              )
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {reasoningEnabled ? (
        <Select
          value={reasoningEffort}
          onValueChange={(value) => setReasoningEffort(value as ReasoningEffort)}
          disabled={disabled}
        >
          <SelectTrigger size="sm" className="h-8 bg-transparent">
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
    </div>
  )
}
