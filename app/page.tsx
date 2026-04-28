import { supabase, type Lead, type Contract, type AgentRun } from '@/lib/supabase'
import MetricsCard from '@/components/MetricsCard'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const revalidate = 300 // revalidate every 5 min

async function getDashboardMetrics() {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const [leadsRes, contractsRes, agentRunsRes] = await Promise.all([
    supabase.from('leads').select('id,status,utm_campaign,faturamento,submitted_at')
      .gte('submitted_at', `${yesterday}T00:00:00`),
    supabase.from('contracts').select('id,valor,signed_at')
      .gte('signed_at', `${yesterday}T00:00:00`),
    supabase.from('agent_runs').select('id,task_name,status,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const leads: Pick<Lead, 'id' | 'status' | 'utm_campaign' | 'faturamento' | 'submitted_at'>[] =
    (leadsRes.data as Pick<Lead, 'id' | 'status' | 'utm_campaign' | 'faturamento' | 'submitted_at'>[]) ?? []
  const contracts: Pick<Contract, 'id' | 'valor' | 'signed_at'>[] =
    (contractsRes.data as Pick<Contract, 'id' | 'valor' | 'signed_at'>[]) ?? []
  const agentRuns: Pick<AgentRun, 'id' | 'task_name' | 'status' | 'created_at'>[] =
    (agentRunsRes.data as Pick<AgentRun, 'id' | 'task_name' | 'status' | 'created_at'>[]) ?? []

  const mqls = leads.filter(l => l.status === 'MQL')
  const disq = leads.filter(l => l.status === 'Desqualificado')
  const totalContractValue = contracts.reduce((s, c) => s + (c.valor ?? 0), 0)

  return { leads, mqls, disq, contracts, totalContractValue, agentRuns, yesterday }
}

export default async function DashboardPage() {
  const { leads, mqls, disq, contracts, totalContractValue, agentRuns, yesterday } = await getDashboardMetrics()

  const taxaMQL = leads.length > 0 ? ((mqls.length / leads.length) * 100).toFixed(1) : '0'
  const ticketMedio = contracts.length > 0 ? totalContractValue / contracts.length : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Dados de ontem · {format(new Date(yesterday), "dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard title="Leads" value={leads.length} subtitle="Formulários completos" />
        <MetricsCard title="MQL" value={mqls.length} subtitle={`${taxaMQL}% de taxa`} color="green" />
        <MetricsCard title="Desqualificados" value={disq.length} color="red" />
        <MetricsCard title="Contratos" value={contracts.length} subtitle={`R$ ${totalContractValue.toLocaleString('pt-BR')}`} color="blue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Ticket Médio"
          value={`R$ ${ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          color="yellow"
        />
        <MetricsCard
          title="Taxa MQL→Contrato"
          value={`${mqls.length > 0 ? ((contracts.length / mqls.length) * 100).toFixed(1) : 0}%`}
        />
        <MetricsCard
          title="Lead→Contrato"
          value={`${leads.length > 0 ? ((contracts.length / leads.length) * 100).toFixed(1) : 0}%`}
        />
        <MetricsCard
          title="Valor Assinado"
          value={`R$ ${totalContractValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          color="green"
        />
      </div>

      {/* Recent agent runs */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4 text-gray-300">Agentes Recentes</h2>
        {agentRuns.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum agente rodou ainda.</p>
        ) : (
          <div className="space-y-2">
            {agentRuns.map(run => (
              <div key={run.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-sm text-gray-300">{run.task_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  run.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                  run.status === 'failed'    ? 'bg-red-900/40 text-red-400' :
                  run.status === 'running'   ? 'bg-blue-900/40 text-blue-400' :
                                              'bg-gray-700 text-gray-400'
                }`}>{run.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
