import { useEffect } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { listSkills, saveSkill } from '@/services/skillsService'
import { useSkillsStore } from '@/stores/skillsStore'
import { cn } from '@/lib/utils'

export function SkillsPage() {
  const skills = useSkillsStore((state) => state.skills)
  const selectedId = useSkillsStore((state) => state.selectedId)
  const draftContent = useSkillsStore((state) => state.draftContent)
  const dirty = useSkillsStore((state) => state.dirty)
  const loading = useSkillsStore((state) => state.loading)
  const error = useSkillsStore((state) => state.error)
  const setSkills = useSkillsStore((state) => state.setSkills)
  const select = useSkillsStore((state) => state.select)
  const setDraftContent = useSkillsStore((state) => state.setDraftContent)
  const setLoading = useSkillsStore((state) => state.setLoading)
  const setError = useSkillsStore((state) => state.setError)
  const markSaved = useSkillsStore((state) => state.markSaved)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const items = await listSkills()
        if (cancelled) return
        setSkills(items)
        if (items[0]) select(items[0].id)
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
  }, [select, setError, setLoading, setSkills])

  const selected = skills.find((skill) => skill.id === selectedId)

  async function handleSave() {
    if (!selected) return
    setLoading(true)
    try {
      const saved = await saveSkill(selected, draftContent)
      markSaved(saved.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-64 shrink-0 border-r">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-medium">Skills</div>
          <div className="text-xs text-muted-foreground">
            Local scaffold until gateway routes land
          </div>
        </div>
        <ScrollArea className="h-[calc(100%-57px)]">
          <div className="space-y-1 p-2">
            {skills.map((skill) => (
              <Button
                key={skill.id}
                type="button"
                variant={selectedId === skill.id ? 'secondary' : 'ghost'}
                className="h-auto w-full justify-start px-3 py-2 text-left text-sm"
                onClick={() => select(skill.id)}
              >
                {skill.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-sm font-medium">
              {selected?.name ?? 'No skill selected'}
            </div>
            <div className="text-xs text-muted-foreground">
              {selected?.path ?? 'Select a skill to inspect'}
            </div>
          </div>
          <Button
            onClick={() => void handleSave()}
            disabled={!selected || !dirty || loading}
          >
            <Save className="size-4" />
            Save
          </Button>
        </div>
        {error ? (
          <div className="border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 p-4">
          <Textarea
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            className={cn('h-full min-h-full resize-none font-mono text-xs leading-6')}
            disabled={!selected || loading}
          />
        </div>
      </div>
    </div>
  )
}
