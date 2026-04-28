import { supabase } from '@/lib/supabase'

export const revalidate = 120

export default async function CampanhasPage() {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  const all = campaigns ?? []
  const ativos = all.filter(c => c.status === 'ativo')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{all.length} campanhas · {ativos.length} ativas</p>
        </div>
        <a href="/criativos" className="btn-primary">+ Novo Criativo</a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="text-left py-3 pr-4">Campanha</th>
              <th className="text-left py-3 pr-4">Plataforma</th>
              <th className="text-left py-3 pr-4">Objetivo</th>
              <th className="text-left py-3 pr-4">Orçamento/dia</th>
              <th className="text-left py-3 pr-4">UTM</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {all.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 pr-4 font-medium">{c.name}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
                    {c.platform === 'meta' ? 'Meta' : 'Google'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400">{c.objective}</td>
                <td className="py-3 pr-4 text-gray-300">
                  R$ {c.daily_budget?.toLocaleString('pt-BR') ?? '—'}
                </td>
                <td className="py-3 pr-4 text-gray-500 text-xs max-w-[160px] truncate">{c.utm_campaign}</td>
                <td className="py-3">
                  <span className={
                    c.status === 'ativo'    ? 'badge-mql' :
                    c.status === 'pausado'  ? 'badge-indefinido' :
                                              'badge-disq'
                  }>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {all.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Nenhuma campanha registrada. Sincronize pelo agente.</p>
        )}
      </div>
    </div>
  )
}
