/**
 * Meta Marketing API client
 * Docs: https://developers.facebook.com/docs/marketing-apis
 */

const BASE = 'https://graph.facebook.com/v20.0'
const TOKEN = () => process.env.META_ACCESS_TOKEN!
const AD_ACCOUNT = () => process.env.META_AD_ACCOUNT_ID! // format: act_XXXXXXXXX

// ---------- Types ----------

export interface MetaCampaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: number
  lifetime_budget?: number
  start_time?: string
  stop_time?: string
}

export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  status: string
  daily_budget: number
  optimization_goal: string
  billing_event: string
  targeting: Record<string, unknown>
}

export interface MetaAdCreative {
  id: string
  name: string
  image_hash?: string
  video_id?: string
  object_story_spec: {
    page_id: string
    link_data?: {
      link: string
      message: string
      name: string
      call_to_action: { type: string; value: { link: string } }
    }
  }
}

export interface MetaInsight {
  campaign_id: string
  campaign_name: string
  ad_id?: string
  adset_id?: string
  impressions: string
  clicks: string
  spend: string
  ctr: string
  cpm: string
  date_start: string
  date_stop: string
}

// ---------- Campaigns ----------

export async function listCampaigns(): Promise<MetaCampaign[]> {
  const fields = 'id,name,status,objective,daily_budget,lifetime_budget'
  const res = await metaGet(`/${AD_ACCOUNT()}/campaigns`, { fields, limit: '100' })
  return res.data ?? []
}

export async function createCampaign(params: {
  name: string
  objective: string
  daily_budget: number
  status?: string
}): Promise<{ id: string }> {
  return metaPost(`/${AD_ACCOUNT()}/campaigns`, {
    name: params.name,
    objective: params.objective,
    status: params.status ?? 'PAUSED',
    special_ad_categories: [],
    daily_budget: params.daily_budget * 100, // Meta expects cents
  })
}

export async function updateCampaignStatus(
  campaignId: string,
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
): Promise<{ success: boolean }> {
  return metaPost(`/${campaignId}`, { status })
}

// ---------- Creatives ----------

export async function uploadImageFromUrl(imageUrl: string): Promise<{ hash: string }> {
  return metaPost(`/${AD_ACCOUNT()}/adimages`, { url: imageUrl })
}

export async function createAdCreative(params: {
  name: string
  pageId: string
  imageHash?: string
  videoId?: string
  headline: string
  body: string
  linkUrl: string
  cta: string
}): Promise<{ id: string }> {
  const linkData: Record<string, unknown> = {
    link: params.linkUrl,
    name: params.headline,
    message: params.body,
    call_to_action: { type: params.cta, value: { link: params.linkUrl } },
  }
  if (params.imageHash) linkData.image_hash = params.imageHash

  return metaPost(`/${AD_ACCOUNT()}/adcreatives`, {
    name: params.name,
    object_story_spec: {
      page_id: params.pageId,
      link_data: linkData,
    },
  })
}

export async function createAd(params: {
  name: string
  adsetId: string
  creativeId: string
  status?: string
}): Promise<{ id: string }> {
  return metaPost(`/${AD_ACCOUNT()}/ads`, {
    name: params.name,
    adset_id: params.adsetId,
    creative: { creative_id: params.creativeId },
    status: params.status ?? 'PAUSED',
  })
}

// ---------- Insights ----------

export async function getCampaignInsights(
  dateFrom: string,
  dateTo: string
): Promise<MetaInsight[]> {
  const fields = 'campaign_id,campaign_name,impressions,clicks,spend,ctr,cpm'
  const res = await metaGet(`/${AD_ACCOUNT()}/insights`, {
    fields,
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    level: 'campaign',
    limit: '100',
  })
  return res.data ?? []
}

export async function getAdInsights(
  dateFrom: string,
  dateTo: string
): Promise<MetaInsight[]> {
  const fields = 'ad_id,adset_id,campaign_id,campaign_name,impressions,clicks,spend,ctr'
  const res = await metaGet(`/${AD_ACCOUNT()}/insights`, {
    fields,
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    level: 'ad',
    limit: '200',
  })
  return res.data ?? []
}

// ---------- HTTP helpers ----------

async function metaGet(path: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN() })
  const res = await fetch(`${BASE}${path}?${qs}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Meta API error: ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function metaPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: TOKEN() }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Meta API error: ${JSON.stringify(err)}`)
  }
  return res.json()
}
