import {
  createCampaign,
  createAdCreative,
  uploadImageFromUrl,
  createAd,
  updateCampaignStatus,
} from '@/lib/meta'
import { supabaseAdmin } from '@/lib/supabase'

export interface PublishAdParams {
  creativeId: string      // Supabase creative id
  campaignName: string
  adSetId: string
  objective: string
  dailyBudget: number
  pageId: string
  linkUrl: string
}

/**
 * Ad Manager Agent
 * Publishes an approved creative to Meta.
 * Flow: upload image → create Meta creative → create ad (paused) → update status in DB
 */
export async function publishAdToMeta(params: PublishAdParams): Promise<{ metaAdId: string }> {
  const db = supabaseAdmin()

  // 1. Get creative from DB
  const { data: creative, error } = await db
    .from('creatives')
    .select('*')
    .eq('id', params.creativeId)
    .single()
  if (error || !creative) throw new Error(`Creative not found: ${params.creativeId}`)
  if (creative.status !== 'aprovado') throw new Error('Creative must be in "aprovado" status before publishing')

  // 2. Upload image to Meta if URL provided
  let imageHash: string | undefined
  if (creative.asset_url) {
    const uploaded = await uploadImageFromUrl(creative.asset_url)
    imageHash = uploaded.hash
  }

  // 3. Create campaign
  const campaign = await createCampaign({
    name: params.campaignName,
    objective: params.objective,
    daily_budget: params.dailyBudget,
    status: 'PAUSED',
  })

  // 4. Create ad creative in Meta
  const metaCreative = await createAdCreative({
    name: creative.name,
    pageId: params.pageId,
    imageHash,
    headline: creative.headline ?? creative.name,
    body: creative.body ?? '',
    linkUrl: params.linkUrl,
    cta: creative.cta ?? 'LEARN_MORE',
  })

  // 5. Create ad (paused — human must activate)
  const ad = await createAd({
    name: creative.name,
    adsetId: params.adSetId,
    creativeId: metaCreative.id as string,
    status: 'PAUSED',
  })

  // 6. Update creative status in DB
  await db.from('creatives').update({
    status: 'publicado',
    meta_creative_id: metaCreative.id as string,
  }).eq('id', params.creativeId)

  return { metaAdId: ad.id as string }
}

/** Pause a running campaign */
export async function pauseCampaign(metaCampaignId: string): Promise<void> {
  await updateCampaignStatus(metaCampaignId, 'PAUSED')
}

/** Activate a paused campaign */
export async function activateCampaign(metaCampaignId: string): Promise<void> {
  await updateCampaignStatus(metaCampaignId, 'ACTIVE')
}
