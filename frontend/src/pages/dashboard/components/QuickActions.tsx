import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  ClipboardCheck,
  CreditCard,
  FileText,
  Bell,
  Calendar,
} from 'lucide-react'

const actions = [
  {
    label: 'Add Student',
    icon: UserPlus,
    path: '/students/new',
    color: 'text-primary',
    bg: 'bg-primary/10 hover:bg-primary/20',
  },
  {
    label: 'Mark Attendance',
    icon: ClipboardCheck,
    path: '/attendance',
    color: 'text-success',
    bg: 'bg-success/10 hover:bg-success/20',
  },
  {
    label: 'Collect Fee',
    icon: CreditCard,
    path: '/fees',
    color: 'text-warning',
    bg: 'bg-warning/10 hover:bg-warning/20',
  },
  {
    label: 'Add Exam',
    icon: FileText,
    path: '/exams/new',
    color: 'text-destructive',
    bg: 'bg-destructive/10 hover:bg-destructive/20',
  },
  {
    label: 'Post Notice',
    icon: Bell,
    path: '/notices/new',
    color: 'text-info',
    bg: 'bg-info/10 hover:bg-info/20',
  },
  {
    label: 'Schedule',
    icon: Calendar,
    path: '/timetable',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
  },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="ghost"
                className={`w-full h-auto flex-col gap-2 py-4 ${action.bg} transition-all duration-200`}
                onClick={() => navigate(action.path)}
              >
                <Icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-xs font-medium text-foreground">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}

