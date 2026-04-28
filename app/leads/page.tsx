import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 120

export default async function LeadsPage() {
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(200)

  const all = leads ?? []
  const mqls = all.filter(l => l.status === 'MQL')
  const disq = all.filter(l => l.status === 'Desqualificado')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-gray-400 text-sm mt-0.5">{all.length} leads · {mqls.length} MQL · {disq.length} desqualificados</p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3">
        <span className="card px-4 py-2 text-sm">Total <b className="ml-1 text-white">{all.length}</b></span>
        <span className="card px-4 py-2 text-sm">MQL <b className="ml-1 text-green-400">{mqls.length}</b></span>
        <span className="card px-4 py-2 text-sm">Desq <b className="ml-1 text-red-400">{disq.length}</b></span>
        <span className="card px-4 py-2 text-sm">Taxa <b className="ml-1 text-blue-400">{all.length > 0 ? ((mqls.length / all.length) * 100).toFixed(1) : 0}%</b></span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="text-left py-3 pr-4">Nome</th>
              <th className="text-left py-3 pr-4">Status</th>
              <th className="text-left py-3 pr-4">Faturamento</th>
              <th className="text-left py-3 pr-4">Nicho</th>
              <th className="text-left py-3 pr-4">Campanha</th>
              <th className="text-left py-3 pr-4">Fonte</th>
              <th className="text-left py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {all.map(lead => (
              <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 pr-4 font-medium">{lead.nome || '—'}</td>
                <td className="py-3 pr-4">
                  <span className={
                    lead.status === 'MQL'            ? 'badge-mql' :
                    lead.status === 'Desqualificado' ? 'badge-disq' :
                                                       'badge-indefinido'
                  }>{lead.status}</span>
                </td>
                <td className="py-3 pr-4 text-gray-400">{lead.faturamento || '—'}</td>
                <td className="py-3 pr-4 text-gray-400">{lead.nicho || '—'}</td>
                <td className="py-3 pr-4 text-gray-500 max-w-[160px] truncate" title={lead.utm_campaign}>
                  {lead.utm_campaign || '—'}
                </td>
                <td className="py-3 pr-4 text-gray-500">{lead.utm_source || '—'}</td>
                <td className="py-3 text-gray-500 text-xs">
                  {lead.submitted_at ? format(new Date(lead.submitted_at), 'dd/MM HH:mm') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {all.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum lead registrado ainda.</p>
        )}
      </div>
    </div>
  )
}
