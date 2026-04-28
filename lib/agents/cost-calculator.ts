import { getCampaignInsights } from '@/lib/meta'
import { supabaseAdmin } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

export interface CampaignMetrics {
  utm_campaign: string
  spend: number
  leads: number
  mqls: number
  desqualificados: number
  taxa_mql: number
  leads_acima_20k: number
  cpl: number
  cost_per_mql: number
  pct_acima_20k: number
  contracts: number
  valor_assinado: number
  custo_por_contrato: number
  roas: number
  taxa_conversao: number
  ticket_medio: number
}

const FATURAMENTOS_ACIMA_20K = [
  'R$20k–R$50k', 'R$50k–R$100k', 'Acima de R$100k',
  'R$ 20.000 a R$ 50.000', 'R$ 50.000 a R$ 100.000', 'Acima de R$ 100.000',
]

/**
 * Cost Calculator Agent
 * Crosses Meta Ads spend with Typeform leads and Monday contracts for a given date.
 */
export async function runCostCalculator(date?: string): Promise<CampaignMetrics[]> {
  const db = supabaseAdmin()
  const target = date ?? format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // 1. Meta spend
  const insights = await getCampaignInsights(target, target)
  const spendByUtm = new Map<string, number>()
  for (const ins of insights) {
    const current = spendByUtm.get(ins.campaign_name) ?? 0
    spendByUtm.set(ins.campaign_name, current + parseFloat(ins.spend ?? '0'))
  }

  // 2. Leads
  const { data: leads } = await db
    .from('leads')
    .select('*')
    .gte('submitted_at', `${target}T00:00:00`)
    .lte('submitted_at', `${target}T23:59:59`)

  // 3. Contracts
  const { data: contracts } = await db
    .from('contracts')
    .select('*')
    .gte('signed_at', `${target}T00:00:00`)
    .lte('signed_at', `${target}T23:59:59`)

  // Gather all utm_campaigns
  const utms = new Set<string>([
    ...Array.from(spendByUtm.keys()),
    ...(leads ?? []).map(l => l.utm_campaign),
    ...(contracts ?? []).map(c => c.utm_campaign ?? ''),
  ])

  const metrics: CampaignMetrics[] = []

  for (const utm of utms) {
    if (!utm) continue
    const spend = spendByUtm.get(utm) ?? 0
    const utmLeads = (leads ?? []).filter(l => l.utm_campaign === utm)
    const utmMqls = utmLeads.filter(l => l.status === 'MQL')
    const utmDisq = utmLeads.filter(l => l.status === 'Desqualificado')
    const utmContracts = (contracts ?? []).filter(c => c.utm_campaign === utm)
    const leadsAbove20k = utmMqls.filter(l => FATURAMENTOS_ACIMA_20K.some(f => l.faturamento?.includes(f)))
    const valorAssinado = utmContracts.reduce((acc, c) => acc + (c.valor ?? 0), 0)

    metrics.push({
      utm_campaign:       utm,
      spend,
      leads:              utmLeads.length,
      mqls:               utmMqls.length,
      desqualificados:    utmDisq.length,
      taxa_mql:           utmLeads.length > 0 ? (utmMqls.length / utmLeads.length) * 100 : 0,
      leads_acima_20k:    leadsAbove20k.length,
      cpl:                utmLeads.length > 0 && spend > 0 ? spend / utmLeads.length : 0,
      cost_per_mql:       utmMqls.length > 0 && spend > 0 ? spend / utmMqls.length : 0,
      pct_acima_20k:      utmMqls.length > 0 ? (leadsAbove20k.length / utmMqls.length) * 100 : 0,
      contracts:          utmContracts.length,
      valor_assinado:     valorAssinado,
      custo_por_contrato: utmContracts.length > 0 && spend > 0 ? spend / utmContracts.length : 0,
      roas:               spend > 0 ? valorAssinado / spend : 0,
      taxa_conversao:     utmMqls.length > 0 ? (utmContracts.length / utmMqls.length) * 100 : 0,
      ticket_medio:       utmContracts.length > 0 ? valorAssinado / utmContracts.length : 0,
    })
  }

  return metrics.sort((a, b) => {
    if (a.contracts > 0 && b.contracts === 0) return -1
    if (b.contracts > 0 && a.contracts === 0) return 1
    if (a.custo_por_contrato > 0 && b.custo_por_contrato > 0)
      return a.custo_por_contrato - b.custo_por_contrato
    return a.cost_per_mql - b.cost_per_mql
  })
}
