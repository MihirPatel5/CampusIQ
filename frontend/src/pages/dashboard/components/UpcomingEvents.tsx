import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Clock } from 'lucide-react'

const events = [
  {
    id: 1,
    title: 'Parent-Teacher Meeting',
    date: 'Jan 18, 2026',
    time: '10:00 AM',
    type: 'meeting',
    badge: 'Important',
    badgeVariant: 'destructive' as const,
  },
  {
    id: 2,
    title: 'Annual Day Celebration',
    date: 'Jan 25, 2026',
    time: '5:00 PM',
    type: 'event',
    badge: 'Event',
    badgeVariant: 'default' as const,
  },
  {
    id: 3,
    title: 'Mid-Term Exams Begin',
    date: 'Feb 1, 2026',
    time: '9:00 AM',
    type: 'exam',
    badge: 'Exam',
    badgeVariant: 'warning' as const,
  },
  {
    id: 4,
    title: 'Science Fair',
    date: 'Feb 10, 2026',
    time: '10:00 AM',
    type: 'event',
    badge: 'Event',
    badgeVariant: 'default' as const,
  },
  {
    id: 5,
    title: 'Sports Day',
    date: 'Feb 15, 2026',
    time: '8:00 AM',
    type: 'event',
    badge: 'Event',
    badgeVariant: 'success' as const,
  },
]

export function UpcomingEvents() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
          <Badge variant="outline" className="text-xs">
            {events.length} Events
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground text-sm">
                    {event.title}
                  </h4>
                  <Badge variant={event.badgeVariant} className="text-xs shrink-0 ml-2">
                    {event.badge}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

