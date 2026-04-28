'use client'

import { useState, useEffect } from 'react'
import { AGENT_TASKS, AgentTask } from '@/lib/token-manager'

interface Balance {
  service: string
  available: number
  daily_limit: number
  reset_at: string
  unit: string
}

interface TaskWithStatus extends AgentTask {
  canRun: boolean
}

export default function TokensPage() {
  const [balances, setBalances] = useState<Balance[]>([])
  const [tasks, setTasks] = useState<TaskWithStatus[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents/run')
      .then(r => r.json())
      .then(data => {
        setBalances(data.balances ?? [])
        setTasks(data.tasks ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const runTask = async (taskId: string) => {
    setRunning(taskId)
    setLastResult(null)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      const data = await res.json()
      if (data.ok) {
        setLastResult(`✅ ${data.task} concluído: ${JSON.stringify(data.result)}`)
        setBalances(data.remainingBalances ?? balances)
      } else {
        setLastResult(`❌ ${data.error}`)
      }
    } catch {
      setLastResult('❌ Erro ao executar agente')
    } finally {
      setRunning(null)
    }
  }

  const pct = (available: number, limit: number) =>
    limit > 0 ? Math.round((available / limit) * 100) : 0

  const serviceLabel: Record<string, string> = {
    meta: 'Meta Ads', monday: 'Monday.com', typeform: 'Typeform',
    anthropic: 'Anthropic AI', google: 'Google Ads',
  }

  const priorityLabel = (p: number) =>
    p === 1 ? { label: 'Crítico', cls: 'text-red-400' } :
    p === 2 ? { label: 'Normal', cls: 'text-yellow-400' } :
              { label: 'Baixa', cls: 'text-gray-400' }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tokens & Agentes</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Orçamento de API disponível e quais tarefas podem rodar agora
        </p>
      </div>

      {/* Token balances */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Orçamento de API (hoje)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : balances.map(b => {
            const p = pct(b.available, b.daily_limit)
            return (
              <div key={b.service} className="card">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium">{serviceLabel[b.service] ?? b.service}</span>
                  <span className={`text-xs ${p > 50 ? 'text-green-400' : p > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {p}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${p > 50 ? 'bg-green-500' : p > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {b.available.toLocaleString()} / {b.daily_limit.toLocaleString()} {b.unit}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task queue */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Fila de Tarefas</h2>
        {lastResult && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${lastResult.startsWith('✅') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {lastResult}
          </div>
        )}
        <div className="space-y-2">
          {tasks.map(task => {
            const pri = priorityLabel(task.priority)
            return (
              <div key={task.id} className={`card flex items-center justify-between gap-4 ${!task.canRun ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{task.name}</span>
                    <span className={`text-xs ${pri.cls}`}>{pri.label}</span>
                    {!task.canRun && (
                      <span className="text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">Sem tokens</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{task.description}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {Object.entries(task.costs).map(([svc, cost]) => (
                      cost > 0 && (
                        <span key={svc} className="text-xs text-gray-600">
                          {serviceLabel[svc] ?? svc}: {cost} {svc === 'anthropic' ? 'tokens' : 'calls'}
                        </span>
                      )
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => runTask(task.id)}
                  disabled={!task.canRun || running === task.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    task.canRun
                      ? 'bg-brand-500 hover:bg-brand-600 text-white'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {running === task.id ? 'Rodando...' : '▶ Rodar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
