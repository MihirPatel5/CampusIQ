import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Clock, Loader2, AlertCircle } from 'lucide-react'
import { eventService } from '@/services/eventService'
import { Event } from '@/types'
import { format } from 'date-fns'

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents()
        setEvents(data)
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setError('Failed to load events')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'holiday': return 'success'
      case 'meeting': return 'destructive'
      case 'exam': return 'warning'
      case 'celebration': return 'default'
      default: return 'outline'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
          {!isLoading && (
            <Badge variant="outline" className="text-xs">
              {events.length} Events
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-20 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-20">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    <Badge variant={getBadgeVariant(event.event_type) as any} className="text-xs shrink-0 ml-2 capitalize">
                      {event.event_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(event.start_datetime), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{format(new Date(event.start_datetime), 'hh:mm a')}</span>
                    </div>
                  </div>
                  {event.audience === 'class' && (
                    <div className="mt-2 text-[10px] text-primary/70 font-medium">
                      Target: {event.target_class_name} {event.target_section_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

