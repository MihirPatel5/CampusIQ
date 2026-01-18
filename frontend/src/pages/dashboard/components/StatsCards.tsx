import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { dashboardService } from '@/services/dashboardService'
import {
  Users,
  GraduationCap,
  CreditCard,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Building2,
  Activity,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
  gradient: string
  iconColor: string
  delay?: number
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'users': <Users className="h-6 w-6 text-primary" />,
  'graduation-cap': <GraduationCap className="h-6 w-6 text-success" />,
  'credit-card': <CreditCard className="h-6 w-6 text-warning" />,
  'clipboard-check': <ClipboardCheck className="h-6 w-6 text-info" />,
  'building': <Building2 className="h-6 w-6 text-primary" />,
  'activity': <Activity className="h-6 w-6 text-success" />,
}

const GRADIENTS = [
  'stat-gradient-blue',
  'stat-gradient-green',
  'stat-gradient-orange',
  'stat-gradient-cyan',
]

const ICON_COLORS = [
  'bg-primary/10',
  'bg-success/10',
  'bg-warning/10',
  'bg-info/10',
]

function StatCard({
  title,
  value,
  change,
  changeLabel = 'from last month',
  icon,
  gradient,
  iconColor,
  delay = 0,
}: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className={cn('relative overflow-hidden p-6 card-hover', gradient)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {isPositive && (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-success font-medium">+{change}%</span>
                  </>
                )}
                {isNegative && (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-destructive font-medium">{change}%</span>
                  </>
                )}
                <span className="text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              iconColor
            )}
          >
            {ICON_MAP[icon] || <Activity className="h-6 w-6" />}
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-current" />
      </Card>
    </motion.div>
  )
}

export function StatsCards() {
  const [stats, setStats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats(data.stats)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-muted/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <StatCard 
          key={stat.title} 
          {...stat} 
          delay={index * 0.1} 
          gradient={GRADIENTS[index % GRADIENTS.length]}
          iconColor={ICON_COLORS[index % ICON_COLORS.length]}
        />
      ))}
    </div>
  )
}

