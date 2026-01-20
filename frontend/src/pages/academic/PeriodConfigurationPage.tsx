import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { toast } from 'sonner'
import { timetableService } from '@/services/timetableService'
import type { Period } from '@/types'
import { Plus, Trash2, Edit2, Clock, Coffee } from 'lucide-react'

export default function PeriodConfigurationPage() {
    const [periods, setPeriods] = useState<Period[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        start_time: '',
        end_time: '',
        is_break: false,
        order: 1
    })

    useEffect(() => {
        fetchPeriods()
    }, [])

    const fetchPeriods = async () => {
        try {
            setLoading(true)
            const data = await timetableService.getPeriods()
            // Sort by order
            const sorted = [...data].sort((a, b) => a.order - b.order)
            setPeriods(sorted)
            // Auto-set next order
            setFormData(prev => ({ ...prev, order: sorted.length + 1 }))
        } catch (error) {
            toast.error('Failed to load periods')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingPeriod) {
                await timetableService.updatePeriod(editingPeriod.id, formData)
                toast.success('Period updated successfully')
            } else {
                await timetableService.createPeriod(formData)
                toast.success('Period created successfully')
            }
            setIsDialogOpen(false)
            resetForm()
            fetchPeriods()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Operation failed')
            console.error(error)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this period? This might affect existing timetables.')) return
        try {
            await timetableService.deletePeriod(id)
            toast.success('Period deleted')
            fetchPeriods()
        } catch (error) {
            toast.error('Failed to delete period')
        }
    }

    const handleEdit = (period: Period) => {
        setEditingPeriod(period)
        setFormData({
            name: period.name,
            start_time: period.start_time, // Format might need adjustment depending on backend exact response (HH:MM:SS vs HH:MM)
            end_time: period.end_time,
            is_break: period.is_break,
            order: period.order
        })
        setIsDialogOpen(true)
    }

    const resetForm = () => {
        setEditingPeriod(null)
        setFormData({
            name: '',
            start_time: '',
            end_time: '',
            is_break: false,
            order: periods.length + 1
        })
    }

    if (loading && periods.length === 0) return <LoadingScreen />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Period Configuration</h1>
                    <p className="text-muted-foreground">Define the daily schedule structure for your school.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add Period</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingPeriod ? 'Edit Period' : 'Add New Period'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Period Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Period 1, Lunch Break"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_time">Start Time</Label>
                                    <Input
                                        type="time"
                                        id="start_time"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_time">End Time</Label>
                                    <Input
                                        type="time"
                                        id="end_time"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="order">Order Sequence</Label>
                                <Input
                                    type="number"
                                    id="order"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_break"
                                    checked={formData.is_break}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_break: checked as boolean })}
                                />
                                <Label htmlFor="is_break" className="cursor-pointer">
                                    Is this a Break / Recess?
                                </Label>
                            </div>

                            <Button type="submit" className="w-full">
                                {editingPeriod ? 'Update Period' : 'Create Period'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {periods.map((period) => (
                    <Card key={period.id} className={period.is_break ? 'border-dashed bg-muted/50' : ''}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-sm font-mono px-2 py-0.5 rounded">#{period.order}</span>
                                        {period.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center mt-1">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {period.start_time} - {period.end_time}
                                    </CardDescription>
                                </div>
                                {period.is_break && (
                                    <div className="bg-orange-100 text-orange-700 p-1.5 rounded-full" title="Break">
                                        <Coffee className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(period)}>
                                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(period.id)}>
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {periods.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        No periods defined yet. Click "Add Period" to start setup.
                    </div>
                )}
            </div>
        </div>
    )
}
