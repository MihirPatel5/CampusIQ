import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Save, Search, History, UserCheck, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { attendanceService } from '@/services/attendanceService'
import { teacherService } from '@/services/teacherService'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'

interface StaffAttendanceRecord {
    user_id: number;
    name: string;
    role: string;
    status: 'present' | 'absent' | 'late' | 'leave' | null;
    remarks: string;
}

export default function StaffAttendancePage() {
    const [staff, setStaff] = useState<StaffAttendanceRecord[]>([])
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string>('all')

    // History State
    const [historyRecords, setHistoryRecords] = useState<any[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [historyFilters, setHistoryFilters] = useState({
        date_from: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
        date_to: format(new Date(), 'yyyy-MM-dd'),
        role: 'all'
    })

    const user = useAuthStore((state) => state.user)
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

    useEffect(() => {
        if (isAdmin) {
            fetchStaffForMarking()
            fetchHistory()
        }
    }, [isAdmin, date, selectedRole])

    const fetchStaffForMarking = async () => {
        setIsLoading(true)
        try {
            // We need a list of all staff (Teachers + Admins)
            // For now, let's fetch teachers and combine with admins if needed, 
            // but usually we want to fetch precisely what the backend expects.

            // Re-using teacher service but we might need a generic user search
            const teachers = await teacherService.getTeachers({ status: 'active' })

            // Mocking for now as we don't have a generic "search staff" service yet
            // In a real scenario, we'd have a specific endpoint or use existing ones.

            // Map to StaffAttendanceRecord
            const staffList: StaffAttendanceRecord[] = teachers.map((t: any) => ({
                user_id: t.user.id,
                name: `${t.user.first_name} ${t.user.last_name}`,
                role: t.user.role,
                status: null,
                remarks: ''
            }))

            // Fetch existing attendance for this date
            const existing = await attendanceService.getStaffAttendance({ date })
            const existingMap = new Map(existing.map((rec: any) => [rec.user, rec]))

            const merged = staffList.map(s => {
                const record = existingMap.get(s.user_id) as any
                return record ? { ...s, status: record.status, remarks: record.remarks } : s
            })

            setStaff(merged)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const fetchHistory = async () => {
        setIsLoadingHistory(true)
        try {
            const params: any = {
                date_from: historyFilters.date_from,
                date_to: historyFilters.date_to
            }
            if (historyFilters.role !== 'all') params.role = historyFilters.role

            const data = await attendanceService.getStaffAttendance(params)
            setHistoryRecords(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleStatusChange = (userId: number, status: 'present' | 'absent' | 'late' | 'leave') => {
        setStaff(prev => prev.map(s => s.user_id === userId ? { ...s, status } : s))
    }

    const handleRemarksChange = (userId: number, remarks: string) => {
        setStaff(prev => prev.map(s => s.user_id === userId ? { ...s, remarks } : s))
    }

    const handleMarkAll = (status: 'present' | 'absent') => {
        setStaff(prev => prev.map(s => ({ ...s, status })))
    }

    const handleSave = async () => {
        const unMarked = staff.filter(s => !s.status)
        if (unMarked.length > 0) {
            toast.warning(`Please mark attendance for all staff (${unMarked.length} remaining)`)
            return
        }

        setIsSaving(true)
        try {
            await attendanceService.markStaffAttendance({
                date,
                attendance: staff.map(s => ({
                    user_id: s.user_id,
                    status: s.status!,
                    remarks: s.remarks
                }))
            })
            toast.success('Staff attendance saved successfully')
            setIsEditing(false)
            fetchHistory()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const filteredStaff = staff.filter(s =>
        (selectedRole === 'all' || s.role === selectedRole) &&
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (!isAdmin) {
        return <div className="p-8 text-center">You do not have permission to view this page.</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Staff Attendance</h1>
                <p className="text-muted-foreground mt-1">
                    Mark and manage attendance for Teachers and Staff
                </p>
            </div>

            <Tabs defaultValue="marking" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="marking" className="gap-2">
                        <UserCheck className="h-4 w-4" /> Marking
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" /> History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="marking" className="space-y-6">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Attendance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        max={format(new Date(), 'yyyy-MM-dd')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Filter by Role</Label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Roles" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="teacher">Teachers</SelectItem>
                                            <SelectItem value="admin">Admin Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {staff.length > 0 ? (
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                                <div>
                                    <CardTitle>Staff List</CardTitle>
                                    <CardDescription>
                                        Found {filteredStaff.length} staff members
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {!isEditing ? (
                                        <Button onClick={() => setIsEditing(true)} className="gap-2 rounded-full px-6">
                                            <Pencil className="h-4 w-4" /> Edit Attendance
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')} className="text-success border-success/30 hover:bg-success/5">
                                                Mark All Present
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')} className="text-destructive border-destructive/30 hover:bg-destructive/5">
                                                Mark All Absent
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground border-y">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-semibold">Staff Name</th>
                                                <th className="px-6 py-3 text-left font-semibold">Role</th>
                                                <th className="px-6 py-3 text-center font-semibold">Status</th>
                                                <th className="px-6 py-3 text-left font-semibold">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredStaff.map((member) => (
                                                <tr key={member.user_id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {member.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {[
                                                                { id: 'present', icon: CheckCircle2, activeClass: 'text-success bg-success/10 border-success/30' },
                                                                { id: 'absent', icon: XCircle, activeClass: 'text-destructive bg-destructive/10 border-destructive/30' },
                                                                { id: 'late', icon: Clock, activeClass: 'text-warning bg-warning/10 border-warning/30' },
                                                                { id: 'leave', icon: AlertCircle, activeClass: 'text-info bg-info/10 border-info/30' },
                                                            ].map((opt) => {
                                                                const Icon = opt.icon
                                                                const isActive = member.status === opt.id
                                                                if (!isEditing && !isActive) return null;
                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={() => isEditing && handleStatusChange(member.user_id, opt.id as any)}
                                                                        disabled={!isEditing}
                                                                        className={cn(
                                                                            "p-2 rounded-lg border border-transparent transition-all capitalize flex flex-col items-center gap-1 min-w-[60px]",
                                                                            isActive ? opt.activeClass : "hover:bg-muted text-muted-foreground",
                                                                            !isEditing && "cursor-default"
                                                                        )}
                                                                    >
                                                                        <Icon className="h-4 w-4" />
                                                                        <span className="text-[10px] font-medium">{opt.id}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                            {!isEditing && !member.status && (
                                                                <span className="text-muted-foreground text-xs italic">Not Marked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Input
                                                            placeholder="Add remarks..."
                                                            value={member.remarks}
                                                            onChange={(e) => handleRemarksChange(member.user_id, e.target.value)}
                                                            className="h-8 text-xs"
                                                            disabled={!isEditing}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t p-6">
                                <div className="text-sm text-muted-foreground">
                                    {filteredStaff.filter(s => s.status === 'present').length} Present, {filteredStaff.filter(s => s.status === 'absent').length} Absent
                                </div>
                                {isEditing && (
                                    <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Attendance
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ) : (
                        <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed">
                            {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" /> : <p>No staff members found.</p>}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">History Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>From</Label>
                                    <Input
                                        type="date"
                                        value={historyFilters.date_from}
                                        onChange={(e) => setHistoryFilters({ ...historyFilters, date_from: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>To</Label>
                                    <Input
                                        type="date"
                                        value={historyFilters.date_to}
                                        onChange={(e) => setHistoryFilters({ ...historyFilters, date_to: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={historyFilters.role}
                                        onValueChange={(v) => setHistoryFilters({ ...historyFilters, role: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="teacher">Teachers</SelectItem>
                                            <SelectItem value="admin">Admin Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={fetchHistory} variant="secondary" className="gap-2">
                                    <Search className="h-4 w-4" /> Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="border rounded-xl bg-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Staff Member</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-foreground/80">
                                {isLoadingHistory ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td></tr>
                                    ))
                                ) : historyRecords.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No records found.</td></tr>
                                ) : historyRecords.map((rec: any) => (
                                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{format(new Date(rec.date), 'dd MMM yyyy')}</td>
                                        <td className="px-6 py-4 font-semibold">{rec.user_name}</td>
                                        <td className="px-6 py-4 capitalize">{rec.user_role}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn("capitalize",
                                                rec.status === 'present' ? 'bg-success/10 text-success border-success/20' :
                                                    rec.status === 'absent' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                        'bg-warning/10 text-warning border-warning/20'
                                            )}>
                                                {rec.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs italic opacity-70">{rec.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
