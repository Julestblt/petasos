import { hermesClient } from '@/services/hermesClient'
import type { SkillFile } from '@/types/hermes'

const STARTER_SKILL: SkillFile = {
  id: 'welcome',
  name: 'welcome.md',
  path: 'skills/welcome.md',
  content: `# Welcome

This skill explorer reads Markdown skills from the Hermes sandbox volume.

Path on host:

\`sandbox/sandbox-data/hermes/skills/\`

Tauri filesystem access will land in a follow-up iteration. Until then, this starter document shows the editing surface.
`,
  updatedAt: new Date().toISOString(),
}

export async function listSkills(): Promise<SkillFile[]> {
  try {
    await hermesClient.getCapabilities()
  } catch {
    // Capabilities probe is best-effort for this scaffold.
  }

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
