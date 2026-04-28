import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 120

export default async function ContratosPage() {
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .order('signed_at', { ascending: false })
    .limit(200)

  const all = contracts ?? []
  const totalValue = all.reduce((s, c) => s + (c.valor ?? 0), 0)
  const ticketMedio = all.length > 0 ? totalValue / all.length : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {all.length} contratos · R$ {totalValue.toLocaleString('pt-BR')} total · Ticket médio R$ {ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="text-left py-3 pr-4">Cliente</th>
              <th className="text-left py-3 pr-4">Valor</th>
              <th className="text-left py-3 pr-4">Plataforma</th>
              <th className="text-left py-3 pr-4">Closer</th>
              <th className="text-left py-3 pr-4">Campanha</th>
              <th className="text-left py-3">Assinado em</th>
            </tr>
          </thead>
          <tbody>
            {all.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="py-3 pr-4 font-medium">{c.nome}</td>
                <td className="py-3 pr-4 text-green-400 font-semibold">
                  R$ {(c.valor ?? 0).toLocaleString('pt-BR')}
                </td>
                <td className="py-3 pr-4 text-gray-400">{c.plataforma || '—'}</td>
                <td className="py-3 pr-4 text-gray-400">{c.closer || '—'}</td>
                <td className="py-3 pr-4 text-gray-500 text-xs max-w-[160px] truncate">{c.utm_campaign || '—'}</td>
                <td className="py-3 text-gray-500 text-xs">
                  {c.signed_at ? format(new Date(c.signed_at), 'dd/MM/yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {all.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum contrato registrado. Sincronize pelo agente Monday.</p>
        )}
      </div>
    </div>
  )
}
