'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

interface Creative {
  id: string
  name: string
  platform: string
  format: string
  headline: string
  body: string
  cta: string
  asset_url?: string
  status: string
  created_at: string
}

export default function CriativosPage() {
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', platform: 'meta', format: 'imagem',
    headline: '', body: '', cta: 'LEARN_MORE', asset_url: '',
    campaign_id: '',
  })
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [publishForm, setPublishForm] = useState({
    campaignName: '', adSetId: '', objective: 'LEAD_GENERATION',
    dailyBudget: '', pageId: '', linkUrl: '',
  })

  const saveDraft = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/meta/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        setCreatives(prev => [data.creative, ...prev])
        setShowForm(false)
        setForm({ name: '', platform: 'meta', format: 'imagem', headline: '', body: '', cta: 'LEARN_MORE', asset_url: '', campaign_id: '' })
      }
    } finally {
      setLoading(false)
    }
  }

  const publishToMeta = async (creative: Creative) => {
    setLoading(true)
    try {
      const res = await fetch('/api/meta/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creativeId: creative.id, ...publishForm }),
      })
      const data = await res.json()
      if (data.ok) {
        alert(`Publicado! Ad ID: ${data.metaAdId}`)
        setPublishingId(null)
      } else {
        alert('Erro: ' + data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Criativos</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gerencie e publique criativos no Meta Ads</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Upload size={14} /> Novo Criativo
        </button>
      </div>

      {/* New creative form */}
      {showForm && (
        <div className="card space-y-4 border-brand-500/30">
          <h2 className="font-semibold text-sm">Novo Criativo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Oferta Abril - Vídeo 1" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Formato</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                <option value="imagem">Imagem</option>
                <option value="video">Vídeo</option>
                <option value="carousel">Carrossel</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">URL do Asset (imagem/vídeo)</label>
            <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              value={form.asset_url} onChange={e => setForm(f => ({ ...f, asset_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Headline</label>
            <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Texto do anúncio</label>
            <textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white h-20 resize-none"
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">CTA</label>
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}>
              <option value="LEARN_MORE">Saiba Mais</option>
              <option value="SIGN_UP">Cadastrar</option>
              <option value="CONTACT_US">Fale Conosco</option>
              <option value="GET_QUOTE">Solicitar Orçamento</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={saveDraft} disabled={loading || !form.name} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      )}

      {/* Publish modal */}
      {publishingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold">Publicar no Meta Ads</h2>
            <p className="text-xs text-gray-400">Preencha os detalhes da campanha. O anúncio será criado como <b>PAUSADO</b>.</p>
            {[
              ['campaignName', 'Nome da Campanha', 'Ex: Oferta Abril'],
              ['adSetId', 'ID do AdSet', '123456789'],
              ['pageId', 'ID da Página Facebook', '1234567890'],
              ['linkUrl', 'URL de destino', 'https://...'],
              ['dailyBudget', 'Orçamento diário (R$)', '100'],
            ].map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder={placeholder}
                  value={(publishForm as Record<string, string>)[key]}
                  onChange={e => setPublishForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  const c = creatives.find(c => c.id === publishingId)
                  if (c) publishToMeta(c)
                }}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
              <button onClick={() => setPublishingId(null)} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Creatives grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creatives.map(c => (
          <div key={c.id} className="card space-y-3">
            {c.asset_url ? (
              <img src={c.asset_url} alt={c.name} className="w-full h-40 object-cover rounded-lg bg-gray-800" />
            ) : (
              <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                <ImageIcon size={32} className="text-gray-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{c.name}</p>
              {c.headline && <p className="text-xs text-gray-400 mt-0.5">{c.headline}</p>}
            </div>
            <div className="flex items-center justify-between">
              <span className={`badge-${c.status}`}>{c.status}</span>
              {c.status === 'aprovado' && (
                <button onClick={() => setPublishingId(c.id)} className="text-xs text-brand-400 hover:text-brand-300">
                  Publicar →
                </button>
              )}
            </div>
          </div>
        ))}
        {creatives.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-500 text-sm">
            Nenhum criativo ainda. Crie um acima.
          </div>
        )}
      </div>
    </div>
  )
}
