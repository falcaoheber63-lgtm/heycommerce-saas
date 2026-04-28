import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface MondayWebhookPayload {
  event: {
    type: string
    boardId: number
    itemId: number
    itemName: string
    columnId: string
    value: { label?: { text: string } }
    previousValue?: { label?: { text: string } }
    createdAt: string
  }
}

const CONTRACT_SIGNED_STATUS = 'CONTRATO ASSINADO'
const MEETING_STATUS         = 'REUNIÃO AGENDADA'

/**
 * Monday.com Automation webhook
 * Fired when a column value changes (status updates in CRM Comercial)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as MondayWebhookPayload

    // Monday challenge handshake
    const challenge = (body as Record<string, unknown>).challenge
    if (challenge) return NextResponse.json({ challenge })

    const { event } = body
    if (!event) return NextResponse.json({ ok: true })

    const db = supabaseAdmin()
    const now = new Date().toISOString()
    const statusText = event.value?.label?.text ?? ''

    if (statusText === CONTRACT_SIGNED_STATUS) {
      // Upsert contract record
      await db.from('contracts').upsert(
        {
          monday_item_id: String(event.itemId),
          nome: event.itemName,
          signed_at: event.createdAt ?? now,
          // Other fields (valor, closer, etc.) fetched separately by monday-sync agent
          telefone: '',
          valor: 0,
          plataforma: '',
          closer: '',
        },
        { onConflict: 'monday_item_id' }
      )
    }

    if (statusText === MEETING_STATUS) {
      // Update lead in DB
      await db.from('leads')
        .update({ reuniao_agendada_at: now })
        .eq('monday_item_id', String(event.itemId))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Monday webhook error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
