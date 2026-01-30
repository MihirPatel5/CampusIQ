import { useState, useEffect } from 'react'
import { Bell, Calendar, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { eventService } from '@/services/eventService'
import { Event } from '@/types'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await eventService.getEvents()
                // Take latest 5
                setNotifications(data.slice(0, 5))
                // Mock unread logic for now (e.g., if created in last 24h)
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
                const unread = data.filter((n: Event) => new Date(n.created_at) > dayAgo).length
                setUnreadCount(unread)
            } catch (err) {
                console.error('Failed to fetch notifications:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchNotifications()
        // Poll every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group hover:bg-accent transition-colors">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-border/50 bg-background/95 backdrop-blur-md">
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-accent/30">
                    <DropdownMenuLabel className="p-0 font-display font-bold text-base">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                            New
                        </Badge>
                    )}
                </div>
                <ScrollArea className="max-h-[400px]">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">Checking for updates...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-xs text-muted-foreground">All caught up!</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className="px-4 py-3 cursor-pointer focus:bg-accent/50 border-b border-border/10 last:border-0"
                                >
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-semibold text-foreground line-clamp-1">
                                                {notification.title}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] uppercase h-4 px-1 leading-none bg-primary/5 text-primary border-primary/20"
                                            >
                                                {notification.event_type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {notification.description}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                                <Calendar className="h-3 w-3" />
                                                <span>{format(new Date(notification.start_datetime), 'MMM dd')}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                                <Clock className="h-3 w-3" />
                                                <span>{format(new Date(notification.start_datetime), 'hh:mm a')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-3 border-t border-border/50 bg-accent/10">
                    <Button variant="ghost" size="sm" className="w-full text-xs font-semibold hover:bg-accent/50 group">
                        View All Events
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
