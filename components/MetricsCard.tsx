import { clsx } from 'clsx'

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow'
}

const colorMap = {
  default: 'text-white',
  green:   'text-green-400',
  red:     'text-red-400',
  blue:    'text-blue-400',
  yellow:  'text-yellow-400',
}

export default function MetricsCard({ title, value, subtitle, trend, color = 'default' }: MetricsCardProps) {
  return (
    <div className="card">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{title}</p>
      <p className={clsx('text-2xl font-bold tabular-nums', colorMap[color])}>{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      {trend && (
        <p className={clsx('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
    </div>
  )
}
