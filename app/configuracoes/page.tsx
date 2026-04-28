export default function ConfiguracoesPage() {
  const envVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL',       desc: 'URL do projeto Supabase',             required: true },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',  desc: 'Chave pública Supabase',              required: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY',      desc: 'Service role key (servidor apenas)',  required: true },
    { key: 'META_ACCESS_TOKEN',              desc: 'Token de acesso Meta Marketing API',  required: true },
    { key: 'META_AD_ACCOUNT_ID',             desc: 'ID da conta de anúncios (act_XXX)',   required: true },
    { key: 'META_PAGE_ID',                   desc: 'ID da Página do Facebook',            required: false },
    { key: 'MONDAY_API_TOKEN',               desc: 'Token JWT do Monday.com',             required: true },
    { key: 'TYPEFORM_API_KEY',               desc: 'Chave da API Typeform (tfp_...)',     required: true },
    { key: 'TYPEFORM_FORM_ID',               desc: 'ID do formulário Typeform',           required: true },
    { key: 'TYPEFORM_WEBHOOK_SECRET',        desc: 'Secret para validar webhook Typeform', required: false },
    { key: 'GOOGLE_ADS_CUSTOMER_ID',         desc: 'ID do cliente Google Ads',            required: false },
    { key: 'GOOGLE_ADS_REFRESH_TOKEN',       desc: 'Refresh token Google Ads OAuth',      required: false },
  ]

  const webhooks = [
    { label: 'Typeform Webhook',   url: '/api/webhooks/typeform', desc: 'Configure em Typeform → Connect → Webhooks' },
    { label: 'Monday.com Webhook', url: '/api/webhooks/monday',   desc: 'Configure em Monday → Automations → Integrations → Webhooks' },
  ]

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-400 text-sm mt-0.5">Variáveis de ambiente e webhooks necessários</p>
      </div>

      {/* Env vars */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold mb-2">Variáveis de Ambiente (Vercel)</h2>
        <p className="text-xs text-gray-500">Configure em Vercel → Settings → Environment Variables</p>
        <div className="space-y-2 mt-3">
          {envVars.map(v => (
            <div key={v.key} className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0">
              <code className="text-xs bg-gray-800 px-2 py-1 rounded text-brand-400 whitespace-nowrap">{v.key}</code>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{v.desc}</p>
              </div>
              <span className={`text-xs whitespace-nowrap ${v.required ? 'text-red-400' : 'text-gray-600'}`}>
                {v.required ? 'obrigatório' : 'opcional'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold mb-2">Endpoints de Webhook</h2>
        {webhooks.map(w => (
          <div key={w.url} className="py-2 border-b border-gray-800/50 last:border-0">
            <p className="text-sm font-medium">{w.label}</p>
            <code className="text-xs text-green-400 bg-gray-800 px-2 py-1 rounded block mt-1 w-fit">
              POST https://seu-dominio.vercel.app{w.url}
            </code>
            <p className="text-xs text-gray-500 mt-1">{w.desc}</p>
          </div>
        ))}
      </div>

      {/* Trello / Monday boards */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3">IDs Fixos</h2>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex gap-2"><span className="text-gray-600">Monday Board Contratos Abril:</span> <code className="text-brand-400">18406647318</code></div>
          <div className="flex gap-2"><span className="text-gray-600">Monday CRM Comercial:</span> <code className="text-brand-400">18405117940</code></div>
          <div className="flex gap-2"><span className="text-gray-600">Typeform Form ID:</span> <code className="text-brand-400">nGNWAjjc</code></div>
          <div className="flex gap-2"><span className="text-gray-600">Meta Ad Account:</span> <code className="text-brand-400">598903438299482</code></div>
        </div>
      </div>
    </div>
  )
}
