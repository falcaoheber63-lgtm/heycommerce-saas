import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { publishAdToMeta } from '@/lib/agents/ad-manager'

/** POST /api/meta/upload — publish an approved creative to Meta Ads */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      creativeId: string
      campaignName: string
      adSetId: string
      objective: string
      dailyBudget: number
      pageId: string
      linkUrl: string
    }

    const required = ['creativeId', 'campaignName', 'adSetId', 'objective', 'dailyBudget', 'pageId', 'linkUrl']
    for (const key of required) {
      if (!body[key as keyof typeof body]) {
        return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 })
      }
    }

    const result = await publishAdToMeta(body)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('Meta upload error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** POST /api/meta/upload/creative — save a creative draft to Supabase */
export async function PUT(req: NextRequest) {
  try {
    const db = supabaseAdmin()
    const body = await req.json()

    const { data, error } = await db.from('creatives').insert({
      name: body.name,
      platform: body.platform ?? 'meta',
      format: body.format ?? 'imagem',
      asset_url: body.asset_url,
      headline: body.headline,
      body: body.body,
      cta: body.cta ?? 'LEARN_MORE',
      status: 'rascunho',
      campaign_id: body.campaign_id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, creative: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
