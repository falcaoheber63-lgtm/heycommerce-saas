/**
 * Token Budget System
 *
 * Tracks API quota for each integration and decides which agent tasks
 * can run with the currently available budget. Each task declares its cost
 * upfront; the scheduler only queues tasks that fit within the budget.
 */

export type ServiceKey = 'meta' | 'monday' | 'typeform' | 'anthropic' | 'google'

export interface TokenBalance {
  service: ServiceKey
  available: number
  daily_limit: number
  reset_at: string // ISO date-time when quota resets
  unit: string     // 'calls' | 'tokens' | 'operations'
}

export interface TaskCost {
  meta?: number
  monday?: number
  typeform?: number
  anthropic?: number
  google?: number
}

export interface AgentTask {
  id: string
  name: string
  description: string
  priority: 1 | 2 | 3  // 1=critical, 2=normal, 3=low
  costs: TaskCost
  triggerType: 'webhook' | 'scheduled' | 'manual'
  estimatedDurationMs: number
}

// Static catalogue of all tasks and their costs
export const AGENT_TASKS: AgentTask[] = [
  {
    id: 'lead-classifier',
    name: 'Classificar Leads (Typeform)',
    description: 'Busca novas respostas do Typeform e classifica MQL/Desqualificado',
    priority: 1,
    costs: { typeform: 2, anthropic: 0 },
    triggerType: 'webhook',
    estimatedDurationMs: 3000,
  },
  {
    id: 'cost-calculator',
    name: 'Calcular CPL/ROAS por campanha',
    description: 'Cruza spend do Meta com leads do Typeform e contratos do Monday',
    priority: 1,
    costs: { meta: 5, monday: 3, typeform: 1, anthropic: 0 },
    triggerType: 'scheduled',
    estimatedDurationMs: 8000,
  },
  {
    id: 'monday-sync',
    name: 'Sincronizar pipeline Monday',
    description: 'Atualiza status dos leads no Monday (reunião, contrato)',
    priority: 2,
    costs: { monday: 10 },
    triggerType: 'scheduled',
    estimatedDurationMs: 5000,
  },
  {
    id: 'creative-ranker',
    name: 'Ranquear criativos Meta',
    description: 'Busca CTR, CPL e taxa MQL por criativo e ordena por eficiência',
    priority: 2,
    costs: { meta: 8, anthropic: 500 },
    triggerType: 'scheduled',
    estimatedDurationMs: 12000,
  },
  {
    id: 'ad-publisher',
    name: 'Publicar anúncio no Meta',
    description: 'Cria campanha, conjunto e anúncio a partir de um criativo aprovado',
    priority: 1,
    costs: { meta: 15 },
    triggerType: 'manual',
    estimatedDurationMs: 10000,
  },
  {
    id: 'daily-report',
    name: 'Gerar Relatório Diário',
    description: 'Relatório MQL + Contratos + ROAS por campanha do dia anterior',
    priority: 2,
    costs: { meta: 5, monday: 5, typeform: 2, anthropic: 2000 },
    triggerType: 'scheduled',
    estimatedDurationMs: 30000,
  },
  {
    id: 'utm-auditor',
    name: 'Auditar UTMs com erro',
    description: 'Detecta leads com UTM inválida (undefined, ID numérico, vazio)',
    priority: 3,
    costs: { typeform: 2, anthropic: 300 },
    triggerType: 'scheduled',
    estimatedDurationMs: 5000,
  },
]

/**
 * Given a list of current balances, returns which tasks can run.
 * Tasks are sorted by priority (1 first) then estimated duration (fastest first).
 */
export function getEligibleTasks(balances: TokenBalance[]): AgentTask[] {
  const balanceMap = Object.fromEntries(balances.map(b => [b.service, b.available]))

  return AGENT_TASKS
    .filter(task => canAfford(task.costs, balanceMap))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return a.estimatedDurationMs - b.estimatedDurationMs
    })
}

function canAfford(costs: TaskCost, balances: Record<string, number>): boolean {
  for (const [service, cost] of Object.entries(costs)) {
    const available = balances[service] ?? Infinity
    if (cost > 0 && available < cost) return false
  }
  return true
}

/** Deducts cost from a balance list after a task completes. Returns updated list. */
export function deductCost(balances: TokenBalance[], costs: TaskCost): TokenBalance[] {
  return balances.map(b => {
    const spent = (costs as Record<string, number>)[b.service] ?? 0
    return { ...b, available: Math.max(0, b.available - spent) }
  })
}

/** Default daily quotas (conservative — adjust in env vars) */
export const DEFAULT_BALANCES: TokenBalance[] = [
  { service: 'meta',      available: 200,    daily_limit: 200,    reset_at: tomorrowMidnight(), unit: 'calls' },
  { service: 'monday',    available: 500,    daily_limit: 500,    reset_at: tomorrowMidnight(), unit: 'calls' },
  { service: 'typeform',  available: 100,    daily_limit: 100,    reset_at: tomorrowMidnight(), unit: 'calls' },
  { service: 'anthropic', available: 100000, daily_limit: 100000, reset_at: tomorrowMidnight(), unit: 'tokens' },
  { service: 'google',    available: 100,    daily_limit: 100,    reset_at: tomorrowMidnight(), unit: 'calls' },
]

function tomorrowMidnight(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
