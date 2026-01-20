import { Card } from '@/components/ui/card'
import { LoadingScreen } from '@/components/ui/loading-screen'
import type { Period, TimetableEntry } from '@/types'
import { Plus } from 'lucide-react'

interface TimetableGridProps {
    periods: Period[]
    entries: TimetableEntry[]
    loading?: boolean
    onCellClick?: (day: number, period: Period, entry?: TimetableEntry) => void
    readOnly?: boolean
}

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    // Sunday usually off, but can be added if needed
]

export function TimetableGrid({ periods, entries, loading, onCellClick, readOnly }: TimetableGridProps) {
    if (loading) return <LoadingScreen />

    // Helper to find entry
    const getEntry = (day: number, periodId: number) => {
        return entries.find(e => e.day_of_week === day && e.period === periodId)
    }

    // Helper to sort periods
    const sortedPeriods = [...periods].sort((a, b) => a.order - b.order)

    return (
        <div className="overflow-x-auto rounded-md border">
            <div className="min-w-[1000px]"> {/* Ensure min width for scrolling */}
                {/* Header Row */}
                <div className="grid grid-cols-[100px_1fr] border-b bg-muted/50">
                    <div className="p-3 font-semibold text-center border-r">Day</div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${sortedPeriods.length}, 1fr)` }}>
                        {sortedPeriods.map(period => (
                            <div key={period.id} className="p-2 text-center border-l first:border-l-0">
                                <div className="font-semibold text-sm">{period.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {period.start_time.slice(0, 5)} - {period.end_time.slice(0, 5)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Days Rows */}
                {DAYS.map(day => (
                    <div key={day.id} className="grid grid-cols-[100px_1fr] border-b last:border-0 hover:bg-muted/5 transition-colors">
                        <div className="p-3 font-medium flex items-center justify-center border-r bg-muted/20">
                            {day.name}
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${sortedPeriods.length}, 1fr)` }}>
                            {sortedPeriods.map(period => {
                                const entry = getEntry(day.id, period.id)
                                const isBreak = period.is_break

                                if (isBreak) {
                                    return (
                                        <div key={period.id} className="bg-muted/30 border-l p-1 flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground rotate-0">BREAK</span>
                                        </div>
                                    )
                                }

                                return (
                                    <div
                                        key={period.id}
                                        className={`
                      border-l p-2 min-h-[80px] flex flex-col justify-center items-center text-center transition-all
                      ${!readOnly ? 'cursor-pointer hover:bg-primary/5' : ''}
                      ${entry ? 'bg-primary/10' : ''}
                    `}
                                        onClick={() => !readOnly && onCellClick?.(day.id, period, entry)}
                                    >
                                        {entry ? (
                                            <div className="space-y-1 w-full">
                                                <div className="font-bold text-sm text-primary truncate" title={entry.subject_name}>
                                                    {entry.subject_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate" title={entry.teacher_name}>
                                                    {entry.teacher_name}
                                                </div>
                                            </div>
                                        ) : (
                                            !readOnly && (
                                                <div className="opacity-0 hover:opacity-100 transition-opacity">
                                                    <Plus className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
