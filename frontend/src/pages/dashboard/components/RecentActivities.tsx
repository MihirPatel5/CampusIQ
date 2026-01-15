import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  UserPlus,
  CreditCard,
  ClipboardCheck,
  FileText,
  Bell,
} from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'admission',
    message: 'New student Arjun Sharma admitted to Class 10-A',
    time: '10 minutes ago',
    icon: UserPlus,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 2,
    type: 'payment',
    message: 'Fee payment of ₹25,000 received from Priya Patel',
    time: '25 minutes ago',
    icon: CreditCard,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    id: 3,
    type: 'attendance',
    message: 'Attendance marked for Class 8-B by Mrs. Singh',
    time: '1 hour ago',
    icon: ClipboardCheck,
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
  },
  {
    id: 4,
    type: 'exam',
    message: 'Mid-term exam results published for Class 9',
    time: '2 hours ago',
    icon: FileText,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 5,
    type: 'notice',
    message: 'New notice posted: Annual Day celebration details',
    time: '3 hours ago',
    icon: Bell,
    iconColor: 'text-destructive',
    iconBg: 'bg-destructive/10',
  },
  {
    id: 6,
    type: 'payment',
    message: 'Fee payment of ₹18,500 received from Rahul Kumar',
    time: '4 hours ago',
    icon: CreditCard,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
]

export function RecentActivities() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon
              return (
                <div
                  key={activity.id}
                  className="flex gap-4 items-start pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

