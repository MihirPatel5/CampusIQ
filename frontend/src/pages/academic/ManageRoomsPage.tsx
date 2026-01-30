import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Pencil, Loader2, Building2, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { academicService } from '@/services/academicService'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ClassRoom {
    id: number;
    name: string;
    capacity: number;
    location: string;
    status: 'active' | 'inactive';
}

export default function ManageRoomsPage() {
    const [rooms, setRooms] = useState<ClassRoom[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<ClassRoom | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        capacity: 30,
        location: '',
        status: 'active' as 'active' | 'inactive'
    })

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        setIsLoading(true)
        try {
            const data = await academicService.getClassRooms()
            setRooms(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenDialog = (room?: ClassRoom) => {
        if (room) {
            setSelectedRoom(room)
            setFormData({
                name: room.name,
                capacity: room.capacity,
                location: room.location,
                status: room.status
            })
        } else {
            setSelectedRoom(null)
            setFormData({
                name: '',
                capacity: 30,
                location: '',
                status: 'active'
            })
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Room name is required')
            return
        }

        setIsSaving(true)
        try {
            if (selectedRoom) {
                await academicService.updateClassRoom(selectedRoom.id, formData)
                toast.success('Room updated successfully')
            } else {
                await academicService.createClassRoom(formData)
                toast.success('Room created successfully')
            }
            setIsDialogOpen(false)
            fetchRooms()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this room? This may affect existing timetable entries.')) return

        try {
            await academicService.deleteClassRoom(id)
            toast.success('Room deleted successfully')
            fetchRooms()
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const filteredRooms = rooms.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classrooms & Labs</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage physical spaces and their capacities
                    </p>
                </div>
                <Button className="gap-2 rounded-full px-6" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4" /> Add Room
                </Button>
            </div>

            <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by room name or location..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground border-y">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold">Room Name</th>
                                    <th className="px-6 py-3 text-left font-semibold">Location</th>
                                    <th className="px-6 py-3 text-center font-semibold">Capacity</th>
                                    <th className="px-6 py-3 text-center font-semibold">Status</th>
                                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td></tr>
                                    ))
                                ) : filteredRooms.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No rooms found.
                                        </td>
                                    </tr>
                                ) : filteredRooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <span className="font-semibold text-foreground">{room.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {room.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">{room.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={room.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                                {room.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(room)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(room.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                        <DialogDescription>
                            Enter classroom or facility details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Room Name / Number</Label>
                            <Input
                                placeholder="e.g. Room 101, Science Lab"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Capacity</Label>
                                <Input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Location / Floor</Label>
                            <Input
                                placeholder="e.g. 1st Floor, Block A"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedRoom ? 'Update Room' : 'Create Room'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
