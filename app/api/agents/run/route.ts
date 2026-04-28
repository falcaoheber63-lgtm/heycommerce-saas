import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AGENT_TASKS, getEligibleTasks, deductCost, DEFAULT_BALANCES, TokenBalance } from '@/lib/token-manager'
import { runLeadClassifier } from '@/lib/agents/lead-classifier'
import { runCostCalculator } from '@/lib/agents/cost-calculator'

/**
 * Agent Runner endpoint
 * POST /api/agents/run
 * Body: { taskId: string; date?: string }
 *
 * Returns eligible task list if no taskId provided.
 */
export async function POST(req: NextRequest) {
  const db = supabaseAdmin()
  const body = await req.json() as { taskId?: string; date?: string }

  // Load current token balances from DB (fallback to defaults)
  const { data: dbBalances } = await db.from('token_balances').select('*')
  const balances: TokenBalance[] = (dbBalances && dbBalances.length > 0)
    ? dbBalances as TokenBalance[]
    : DEFAULT_BALANCES

  // If no taskId, return eligible tasks
  if (!body.taskId) {
    const eligible = getEligibleTasks(balances)
    return NextResponse.json({ eligible, balances })
  }

  const task = AGENT_TASKS.find(t => t.id === body.taskId)
  if (!task) return NextResponse.json({ error: 'task not found' }, { status: 404 })

  // Check budget
  const eligible = getEligibleTasks(balances)
  if (!eligible.find(t => t.id === task.id)) {
    return NextResponse.json({
      error: 'Insufficient token budget for this task',
      task: task.name,
      costs: task.costs,
      balances,
    }, { status: 402 })
  }

  // Log run start
  const { data: run } = await db.from('agent_runs').insert({
    task_id: task.id,
    task_name: task.name,
    status: 'running',
    started_at: new Date().toISOString(),
    cost_used: task.costs,
  }).select().single()

  try {
    let result: unknown

    switch (task.id) {
      case 'lead-classifier':
        result = await runLeadClassifier(body.date)
        break
      case 'cost-calculator':
        result = await runCostCalculator(body.date)
        break
      default:
        result = { message: `Task ${task.id} acknowledged — implement runner` }
    }

    // Deduct tokens
    const updated = deductCost(balances, task.costs)
    for (const b of updated) {
      await db.from('token_balances').upsert(
        { ...b, updated_at: new Date().toISOString() },
        { onConflict: 'service' }
      )
    }

    // Mark run complete
    if (run?.id) {
      await db.from('agent_runs').update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        result_summary: JSON.stringify(result).slice(0, 500),
      }).eq('id', run.id)
    }

    return NextResponse.json({ ok: true, task: task.name, result, remainingBalances: updated })
  } catch (err) {
    if (run?.id) {
      await db.from('agent_runs').update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error: String(err),
      }).eq('id', run.id)
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** GET /api/agents/run → returns eligible tasks given current budget */
export async function GET() {
  const db = supabaseAdmin()
  const { data: dbBalances } = await db.from('token_balances').select('*')
  const balances: TokenBalance[] = (dbBalances && dbBalances.length > 0)
    ? dbBalances as TokenBalance[]
    : DEFAULT_BALANCES

  const eligible = getEligibleTasks(balances)
  const allTasks = AGENT_TASKS

  return NextResponse.json({
    balances,
    eligible: eligible.map(t => t.id),
    tasks: allTasks.map(t => ({
      ...t,
      canRun: !!eligible.find(e => e.id === t.id),
    })),
  })
}
