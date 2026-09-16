import { gatewayClient } from '@/services/gatewayClient'
import type { HermesSkill } from '@/types/hermes'

export async function listSkills(): Promise<HermesSkill[]> {
  return gatewayClient.listHermesSkills()
}
