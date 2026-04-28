'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Megaphone, ImageIcon,
  FileSignature, Cpu, Coins, Settings
} from 'lucide-react'

const nav = [
  { href: '/',               label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/leads',          label: 'Leads',        icon: Users },
  { href: '/campanhas',      label: 'Campanhas',    icon: Megaphone },
  { href: '/criativos',      label: 'Criativos',    icon: ImageIcon },
  { href: '/contratos',      label: 'Contratos',    icon: FileSignature },
  { href: '/agentes',        label: 'Agentes',      icon: Cpu },
  { href: '/tokens',         label: 'Tokens',       icon: Coins },
  { href: '/configuracoes',  label: 'Config',       icon: Settings },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-30">
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-brand-500 font-bold text-lg tracking-tight">HeyCommerce</span>
        <span className="text-gray-500 text-xs block">Acquisition OS</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              path === href
                ? 'bg-brand-500/10 text-brand-400 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
        v0.1.0 · Vercel
      </div>
    </aside>
  )
}
