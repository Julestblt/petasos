import type { SkillFile } from '@/types/hermes'

const STARTER_SKILL: SkillFile = {
  id: 'welcome',
  name: 'welcome.md',
  path: 'skills/welcome.md',
  content: `# Welcome

This skill explorer is a local scaffold. The homelab gateway does not expose
Hermes skills or filesystem routes.

Path on host for the local Docker sandbox:

\`sandbox/sandbox-data/hermes/skills/\`

Tauri filesystem access will land in a follow-up iteration.
`,
  updatedAt: new Date().toISOString(),
}

export async function listSkills(): Promise<SkillFile[]> {
  return [STARTER_SKILL]
}

export async function saveSkill(
  skill: SkillFile,
  content: string,
): Promise<SkillFile> {
  return {
    ...skill,
    content,
    updatedAt: new Date().toISOString(),
  }
}
