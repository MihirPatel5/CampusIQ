import { useState, useEffect } from 'react'
import {
    Calendar as CalendarIcon,
    Plus,
    Search,
    Trash2,
    Clock,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Info,
    Loader2
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { eventService } from '@/services/eventService'
import { Event, EventType, EventAudience } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { academicService } from '@/services/academicService'

export default function ManageEventsPage() {
    const { user } = useAuthStore()
    const [events, setEvents] = useState<Event[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

    // Create Event State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        event_type: 'other' as EventType,
        audience: 'global' as EventAudience,
        target_class: '',
        target_section: '',
        start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    })

    const [classes, setClasses] = useState<any[]>([])
    const [sections, setSections] = useState<any[]>([])

    useEffect(() => {
        fetchEvents()
        if (user?.role === 'admin' || user?.role === 'teacher') {
            fetchAcademicData()
        }
    }, [])

    const fetchEvents = async () => {
        try {
            const data = await eventService.getEvents()
            setEvents(data)
        } catch (error) {
            toast.error('Failed to fetch events')
        }
    }

    const fetchAcademicData = async () => {
        try {
            const classesData = await academicService.getClasses()
            setClasses(classesData)
        } catch (error) {
            console.error('Failed to fetch academic data')
        }
    }

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const { target_class, target_section, ...eventData } = newEvent;
            await eventService.createEvent({
                ...(eventData as any),
                target_class: target_class ? parseInt(target_class) : undefined,
                target_section: target_section ? parseInt(target_section) : undefined,
            })
            toast.success('Event scheduled successfully')
            setIsCreateOpen(false)
            fetchEvents()
            setNewEvent({
                title: '',
                description: '',
                event_type: 'other',
                audience: 'global',
                target_class: '',
                target_section: '',
                start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                end_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            })
        } catch (error) {
            toast.error('Failed to schedule event')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteEvent = async (id: number) => {
        if (!confirm('Are you sure you want to delete this event?')) return
        try {
            await eventService.deleteEvent(id)
            toast.success('Event deleted')
            fetchEvents()
        } catch (error) {
            toast.error('Failed to delete event')
        }
    }

    // Calendar Logic
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(new Date(event.start_datetime), day))
    }

    const canCreate = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'super_admin'

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">School Events & Notices</h1>
                    <p className="text-muted-foreground">Manage and view all upcoming activities</p>
                </div>

                {canCreate && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" />
                                Schedule Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Schedule New Event</DialogTitle>
                                <DialogDescription>
                                    Create an event or notice for the school community.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateEvent} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Annual Sports Day"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Event Type</Label>
                                        <Select
                                            value={newEvent.event_type}
                                            onValueChange={v => setNewEvent({ ...newEvent, event_type: v as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="holiday">Holiday</SelectItem>
                                                <SelectItem value="meeting">Meeting</SelectItem>
                                                <SelectItem value="exam">Exam</SelectItem>
                                                <SelectItem value="celebration">Celebration</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Target Audience</Label>
                                        <Select
                                            value={newEvent.audience}
                                            onValueChange={v => setNewEvent({ ...newEvent, audience: v as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="global">Global (Everyone)</SelectItem>
                                                {user?.role === 'admin' && <SelectItem value="staff">Staff Only</SelectItem>}
                                                <SelectItem value="class">Specific Class</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {newEvent.audience === 'class' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid gap-2">
                                            <Label>Class</Label>
                                            <Select
                                                value={newEvent.target_class}
                                                onValueChange={v => {
                                                    setNewEvent({ ...newEvent, target_class: v })
                                                    const cls = classes.find(c => c.id === parseInt(v))
                                                    setSections(cls?.sections || [])
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {classes.map(c => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Section</Label>
                                            <Select
                                                value={newEvent.target_section}
                                                onValueChange={v => setNewEvent({ ...newEvent, target_section: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sections.map(s => (
                                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Start Date & Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newEvent.start_datetime}
                                            onChange={e => setNewEvent({ ...newEvent, start_datetime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>End Date & Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newEvent.end_datetime}
                                            onChange={e => setNewEvent({ ...newEvent, end_datetime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Details about the event..."
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Event'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Calendar/View Toggle */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <CalendarDays className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold capitalize">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </CardTitle>
                                    <CardDescription>School Activity Calendar</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-7 border-b border-border/50">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest bg-accent/30">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {calendarDays.map((day) => {
                                    const dayEvents = getEventsForDay(day)
                                    const isCurrentMonth = isSameMonth(day, currentMonth)
                                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                                    return (
                                        <div
                                            key={day.toString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={cn(
                                                "min-h-[100px] p-2 border-r border-b border-border/20 transition-all cursor-pointer hover:bg-accent/20 relative group",
                                                !isCurrentMonth && "bg-accent/10 opacity-40",
                                                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                                                isToday(day) && "bg-primary/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full mb-1",
                                                isToday(day) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground group-hover:text-foreground"
                                            )}>
                                                {format(day, 'd')}
                                            </span>

                                            <div className="space-y-1 overflow-hidden">
                                                {dayEvents.slice(0, 3).map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={cn(
                                                            "px-1.5 py-0.5 text-[9px] font-bold rounded-sm border truncate uppercase",
                                                            event.event_type === 'holiday' ? "bg-success/10 text-success border-success/20" :
                                                                event.event_type === 'meeting' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                                    event.event_type === 'exam' ? "bg-warning/10 text-warning border-warning/20" :
                                                                        "bg-primary/10 text-primary border-primary/20"
                                                        )}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[8px] font-bold text-muted-foreground/70 pl-1">
                                                        + {dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Event Details & Search */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Event Explorer</CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search events..."
                                    className="pl-9 bg-accent/30"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="upcoming" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4 bg-accent/30">
                                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                    <TabsTrigger value="today">Selected Day</TabsTrigger>
                                </TabsList>

                                <TabsContent value="upcoming" className="space-y-4">
                                    <ScrollArea className="h-[450px] pr-4">
                                        {filteredEvents.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                                <Info className="h-8 w-8 mb-2" />
                                                <p className="text-sm">No events found</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-accent/5 transition-all group relative"
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                                    {event.title}
                                                                </h4>
                                                                <div className="flex items-center gap-3 mt-1 underline-offset-4">
                                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                                        <Clock className="h-3 w-3" />
                                                                        {format(new Date(event.start_datetime), 'MMM dd, h:mm a')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {user?.role === 'admin' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleDeleteEvent(event.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                                            {event.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <Badge variant="secondary" className="text-[9px] uppercase font-bold px-1.5 py-0 bg-accent/50 text-foreground/70">
                                                                {event.event_type}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 py-0 border-primary/20 text-primary/70">
                                                                {event.audience}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="today" className="space-y-4">
                                    {selectedDate && (
                                        <div className="space-y-4">
                                            <div className="text-sm font-semibold text-primary">
                                                Events on {format(selectedDate, 'PPP')}
                                            </div>
                                            <ScrollArea className="h-[400px]">
                                                {getEventsForDay(selectedDate).length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-12 opacity-40">
                                                        <CalendarIcon className="h-10 w-10 mb-2" />
                                                        <p className="text-sm">Nothing scheduled</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {getEventsForDay(selectedDate).map(event => (
                                                            <div key={event.id} className="p-4 rounded-xl border border-border/50 bg-accent/20">
                                                                <h4 className="font-bold text-sm">{event.title}</h4>
                                                                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {format(new Date(event.start_datetime), 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
