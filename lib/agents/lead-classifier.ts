import { getAllResponses } from '@/lib/typeform'
import { supabaseAdmin } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

/**
 * Lead Classifier Agent
 * Fetches Typeform responses for a given date, classifies and upserts into Supabase.
 * Called by the Typeform webhook or on a scheduled basis.
 */
export async function runLeadClassifier(date?: string): Promise<{ processed: number; mqls: number; disq: number }> {
  const db = supabaseAdmin()
  const target = date ?? format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const leads = await getAllResponses(target, target)

  let mqls = 0
  let disq = 0

  for (const lead of leads) {
    const { error } = await db.from('leads').upsert(
      {
        typeform_response_id: lead.response_id,
        nome: lead.nome,
        telefone: lead.telefone,
        faturamento: lead.faturamento,
        nicho: lead.nicho,
        utm_campaign: lead.utm_campaign,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        status: lead.status,
        submitted_at: lead.submitted_at,
      },
      { onConflict: 'typeform_response_id' }
    )
    if (error) console.error('upsert lead error:', error)
    if (lead.status === 'MQL') mqls++
    if (lead.status === 'Desqualificado') disq++
  }

  return { processed: leads.length, mqls, disq }
}
