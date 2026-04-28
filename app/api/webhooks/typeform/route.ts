import { NextRequest, NextResponse } from 'next/server'
import { parseResponse, TypeformResponse } from '@/lib/typeform'
import { supabaseAdmin } from '@/lib/supabase'

/** Typeform sends a POST to this endpoint on each form completion */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { form_response: TypeformResponse }
    const raw = body.form_response
    if (!raw) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

    const lead = parseResponse(raw)
    const db = supabaseAdmin()

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

    if (error) {
      console.error('Typeform webhook DB error:', error)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status: lead.status })
  } catch (err) {
    console.error('Typeform webhook error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
