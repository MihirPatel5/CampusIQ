import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { formatNumber, formatCurrency } from '@/lib/utils'
import {
  Users,
  GraduationCap,
  CreditCard,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  gradient: string
  iconColor: string
  delay?: number
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
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
            <p className="text-3xl font-bold text-foreground">{value}</p>
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
                {changeLabel && (
                  <span className="text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              iconColor
            )}
          >
            {icon}
          </div>
        </div>

        {/* Decorative Element */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-current" />
      </Card>
    </motion.div>
  )
}

// Mock data - replace with API calls
const stats = [
  {
    title: 'Total Students',
    value: formatNumber(2547),
    change: 12,
    changeLabel: 'from last month',
    icon: <Users className="h-6 w-6 text-primary" />,
    gradient: 'stat-gradient-blue',
    iconColor: 'bg-primary/10',
  },
  {
    title: 'Total Teachers',
    value: formatNumber(156),
    change: 3,
    changeLabel: 'new this month',
    icon: <GraduationCap className="h-6 w-6 text-success" />,
    gradient: 'stat-gradient-green',
    iconColor: 'bg-success/10',
  },
  {
    title: 'Fees Collected',
    value: formatCurrency(4250000),
    change: 8,
    changeLabel: 'from last month',
    icon: <CreditCard className="h-6 w-6 text-warning" />,
    gradient: 'stat-gradient-orange',
    iconColor: 'bg-warning/10',
  },
  {
    title: "Today's Attendance",
    value: '94.2%',
    change: -2,
    changeLabel: 'from yesterday',
    icon: <ClipboardCheck className="h-6 w-6 text-info" />,
    gradient: 'stat-gradient-cyan',
    iconColor: 'bg-info/10',
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} delay={index * 0.1} />
      ))}
    </div>
  )
}

