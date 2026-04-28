import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>
        Relationships: []
      }
      campaigns: {
        Row: Campaign
        Insert: Omit<Campaign, 'id' | 'created_at'>
        Update: Partial<Omit<Campaign, 'id' | 'created_at'>>
        Relationships: []
      }
      creatives: {
        Row: Creative
        Insert: Omit<Creative, 'id' | 'created_at'>
        Update: Partial<Omit<Creative, 'id' | 'created_at'>>
        Relationships: []
      }
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at'>
        Update: Partial<Omit<Contract, 'id' | 'created_at'>>
        Relationships: []
      }
      token_balances: {
        Row: TokenBalance
        Insert: Omit<TokenBalance, 'id'>
        Update: Partial<Omit<TokenBalance, 'id'>>
        Relationships: []
      }
      agent_runs: {
        Row: AgentRun
        Insert: Omit<AgentRun, 'id' | 'created_at'>
        Update: Partial<Omit<AgentRun, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface Lead {
  id: string
  created_at: string
  typeform_response_id: string
  nome: string
  telefone: string
  faturamento: string
  nicho: string
  utm_campaign: string
  utm_source: string
  utm_medium: string
  status: 'MQL' | 'Desqualificado' | 'Indefinido'
  monday_item_id?: string
  reuniao_agendada_at?: string
  contrato_assinado_at?: string
  submitted_at: string
}

export interface Campaign {
  id: string
  created_at: string
  meta_campaign_id?: string
  google_campaign_id?: string
  name: string
  platform: 'meta' | 'google'
  status: 'ativo' | 'pausado' | 'encerrado'
  daily_budget: number
  objective: string
  utm_campaign: string
}

export interface Creative {
  id: string
  created_at: string
  name: string
  campaign_id?: string
  platform: 'meta' | 'google'
  format: 'imagem' | 'video' | 'carousel'
  asset_url?: string
  headline?: string
  body?: string
  cta?: string
  meta_creative_id?: string
  status: 'rascunho' | 'aprovado' | 'publicado' | 'pausado' | 'rejeitado'
  metrics?: CreativeMetrics
}

export interface CreativeMetrics {
  impressions: number
  clicks: number
  ctr: number
  spend: number
  leads: number
  mqls: number
  cpl: number
  cost_per_mql: number
  roas: number
}

export interface Contract {
  id: string
  created_at: string
  monday_item_id: string
  nome: string
  telefone: string
  valor: number
  plataforma: string
  closer: string
  utm_campaign?: string
  lead_id?: string
  signed_at: string
}

export interface TokenBalance {
  id: string
  service: string
  available: number
  daily_limit: number
  reset_at: string
  unit: string
  updated_at: string
}

export interface AgentRun {
  id: string
  created_at: string
  task_id: string
  task_name: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  started_at?: string
  finished_at?: string
  cost_used: Record<string, number>
  result_summary?: string
  error?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export function supabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
