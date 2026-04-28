import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 60

export default async function AgentesPage() {
  const { data: runs } = await supabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const all = runs ?? []
  const completed = all.filter(r => r.status === 'completed').length
  const failed = all.filter(r => r.status === 'failed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Agentes</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {all.length} execuções · {completed} sucesso · {failed} falha
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="text-left py-3 pr-4">Agente</th>
              <th className="text-left py-3 pr-4">Status</th>
              <th className="text-left py-3 pr-4">Resultado</th>
              <th className="text-left py-3 pr-4">Iniciado</th>
              <th className="text-left py-3">Duração</th>
            </tr>
          </thead>
          <tbody>
            {all.map(run => {
              const duration = run.started_at && run.finished_at
                ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                : null
              return (
                <tr key={run.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="py-3 pr-4 font-medium">{run.task_name}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      run.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                      run.status === 'failed'    ? 'bg-red-900/40 text-red-400' :
                      run.status === 'running'   ? 'bg-blue-900/40 text-blue-400 animate-pulse' :
                                                  'bg-gray-700 text-gray-400'
                    }`}>{run.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 text-xs max-w-[300px] truncate">
                    {run.error ?? run.result_summary ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {run.started_at ? format(new Date(run.started_at), 'dd/MM HH:mm') : '—'}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">
                    {duration != null ? `${duration}s` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {all.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum agente rodou ainda. Vá em Tokens para executar.</p>
        )}
      </div>
    </div>
  )
}
