/** Typeform API client */

const BASE = 'https://api.typeform.com'
const TOKEN = () => process.env.TYPEFORM_API_KEY!

export const FORM_ID = process.env.TYPEFORM_FORM_ID ?? 'nGNWAjjc'

// Field refs
export const REFS = {
  nome:       'd08d418a-ea82-4317-a9dd-7b51ed16cd39',
  telefone:   '7c43d06d-f79f-43c8-b5e2-cbd979633e96',
  faturamento:'7b3aab8d-2f0b-4617-8ca6-19a911d89e68',
  nicho:      '0c41e97e-5b6f-4f14-8907-3650a61a3864',
}

// Thankyou screen refs → classification
export const SCREEN_REFS = {
  mql:           '4d0e6c33-b83b-4b37-9ebe-5384a77c1262',
  desqualificado:'bcf78c2b-f81f-4dc3-90a9-cf60c0d337db',
}

export interface TypeformResponse {
  landing_id: string
  token: string
  response_id: string
  submitted_at: string
  thankyou_screen_ref: string
  answers: TypeformAnswer[]
  hidden: Record<string, string>
}

export interface TypeformAnswer {
  type: string
  field: { id: string; ref: string; type: string }
  text?: string
  phone_number?: string
  choice?: { id: string; label: string; ref: string }
  boolean?: boolean
  number?: number
}

export interface ParsedLead {
  response_id: string
  submitted_at: string
  status: 'MQL' | 'Desqualificado' | 'Indefinido'
  nome: string
  telefone: string
  telefone_normalizado: string
  faturamento: string
  nicho: string
  utm_campaign: string
  utm_source: string
  utm_medium: string
}

export async function getResponses(
  since: string,
  until: string,
  pageBefore?: string
): Promise<{ items: TypeformResponse[]; total: number; pageCount: number }> {
  const params: Record<string, string> = {
    page_size: '200',
    completed: 'true',
    since,
    until,
  }
  if (pageBefore) params.before = pageBefore

  const qs = new URLSearchParams(params)
  const res = await fetch(`${BASE}/forms/${FORM_ID}/responses?${qs}`, {
    headers: { Authorization: `Bearer ${TOKEN()}` },
  })
  if (!res.ok) throw new Error(`Typeform API ${res.status}: ${await res.text()}`)
  const data = await res.json() as {
    items: TypeformResponse[]
    total_items: number
    page_count: number
  }
  return { items: data.items, total: data.total_items, pageCount: data.page_count }
}

export function parseResponse(r: TypeformResponse): ParsedLead {
  const answers = r.answers ?? []

  const get = (ref: string): TypeformAnswer | undefined =>
    answers.find(a => a.field?.ref === ref)

  const nome = get(REFS.nome)?.text ?? ''
  const telefone = get(REFS.telefone)?.phone_number ?? ''
  const faturamento = get(REFS.faturamento)?.choice?.label ?? ''
  const nicho = get(REFS.nicho)?.choice?.label ?? ''

  let status: 'MQL' | 'Desqualificado' | 'Indefinido'
  if (r.thankyou_screen_ref === SCREEN_REFS.mql) status = 'MQL'
  else if (r.thankyou_screen_ref === SCREEN_REFS.desqualificado) status = 'Desqualificado'
  else status = 'Indefinido'

  const telefone_normalizado = telefone.replace(/\D/g, '').slice(-11)

  return {
    response_id: r.response_id,
    submitted_at: r.submitted_at,
    status,
    nome,
    telefone,
    telefone_normalizado,
    faturamento,
    nicho,
    utm_campaign: r.hidden?.utm_campaign ?? '',
    utm_source:   r.hidden?.utm_source ?? '',
    utm_medium:   r.hidden?.utm_medium ?? '',
  }
}

/** Fetch all responses for a date range, handling pagination */
export async function getAllResponses(dateFrom: string, dateTo: string): Promise<ParsedLead[]> {
  const since = `${dateFrom}T00:00:00`
  const until = `${dateTo}T23:59:59`
  const allItems: TypeformResponse[] = []
  let before: string | undefined

  do {
    const { items } = await getResponses(since, until, before)
    allItems.push(...items)
    before = items.length === 200 ? items[items.length - 1].token : undefined
  } while (before)

  // Deduplicate by phone (keep most recent)
  const seen = new Map<string, ParsedLead>()
  for (const item of allItems.sort((a, b) =>
    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  )) {
    const lead = parseResponse(item)
    const key = lead.telefone_normalizado || lead.response_id
    if (!seen.has(key)) seen.set(key, lead)
  }

  return Array.from(seen.values())
}
