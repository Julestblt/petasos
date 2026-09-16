import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Box,
  Lock,
  Radar,
  Search,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { listSkills } from '@/services/skillsService'
import { useSkillsStore } from '@/stores/skillsStore'
import type { HermesSkill } from '@/types/hermes'

const ALL_CATEGORIES = 'all'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'autonomous-ai-agents': Bot,
  devops: Box,
  research: Radar,
  security: Lock,
  'software-development': Wrench,
}

function formatCategory(category: string): string {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Sparkles
}

export function SkillsPage() {
  const skills = useSkillsStore((state) => state.skills)
  const loading = useSkillsStore((state) => state.loading)
  const error = useSkillsStore((state) => state.error)
  const setSkills = useSkillsStore((state) => state.setSkills)
  const setLoading = useSkillsStore((state) => state.setLoading)
  const setError = useSkillsStore((state) => state.setError)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(undefined)
      try {
        const items = await listSkills()
        if (!cancelled) setSkills(items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load skills')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [setError, setLoading, setSkills])

  const categories = useMemo(() => {
    const set = new Set(skills.map((skill) => skill.category))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [skills])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return skills.filter((skill) => {
      if (categoryFilter !== ALL_CATEGORIES && skill.category !== categoryFilter) {
        return false
      }
      if (!needle) return true
      return (
        skill.name.toLowerCase().includes(needle) ||
        skill.description.toLowerCase().includes(needle) ||
        skill.category.toLowerCase().includes(needle)
      )
    })
  }, [skills, query, categoryFilter])

  const groups = useMemo(() => {
    const map = new Map<string, HermesSkill[]>()
    for (const skill of filtered) {
      const list = map.get(skill.category) ?? []
      list.push(skill)
      map.set(skill.category, list)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl tracking-tight">Skills</h1>
              {!loading && skills.length > 0 ? (
                <Badge variant="secondary">{skills.length}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Hermes-installed skills reported by the gateway overview.
            </p>
          </div>
          <InputGroup className="w-full sm:max-w-xs">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search skills…"
              aria-label="Search skills"
            />
          </InputGroup>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {categories.length > 0 ? (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={2}
            value={categoryFilter}
            onValueChange={(value) => {
              if (value) setCategoryFilter(value)
            }}
            className="flex flex-wrap"
            aria-label="Filter by category"
          >
            <ToggleGroupItem value={ALL_CATEGORIES}>All</ToggleGroupItem>
            {categories.map((category) => (
              <ToggleGroupItem key={category} value={category}>
                {formatCategory(category)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}

        {loading && skills.length === 0 ? (
          <div className="flex flex-col gap-8">
            {[0, 1].map((section) => (
              <div key={section} className="flex flex-col gap-3">
                <Skeleton className="h-4 w-40" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((card) => (
                    <Skeleton key={card} className="h-32 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
            <Search className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">
              {skills.length === 0 ? 'No skills reported' : 'No matching skills'}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {skills.length === 0
                ? 'Hermes did not return any installed skills for this gateway.'
                : 'Try another category or clear the search.'}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-8">
          {groups.map(([category, items]) => {
            const Icon = categoryIcon(category)
            return (
              <section key={category} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium">{formatCategory(category)}</h2>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((skill) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skill }: { skill: HermesSkill }) {
  const Icon = categoryIcon(skill.category)

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-3 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {skill.category}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="font-mono text-sm tracking-tight">
            {skill.name}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {skill.description || 'No description provided.'}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  )
}
