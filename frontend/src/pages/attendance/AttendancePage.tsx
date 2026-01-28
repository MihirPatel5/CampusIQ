import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Save, Search, History, UserCheck, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { academicService } from '@/services/academicService'
import { attendanceService, type StudentForMarking } from '@/services/attendanceService'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/services/api'
import type { Class, Section } from '@/types'
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

export default function AttendancePage() {
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [selectedSection, setSelectedSection] = useState<string>('')
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

    const [students, setStudents] = useState<StudentForMarking[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // History State
    const [historyRecords, setHistoryRecords] = useState<any[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [historyFilters, setHistoryFilters] = useState({
        date_from: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
        date_to: format(new Date(), 'yyyy-MM-dd'),
        class_id: '',
        status: 'all'
    })

    useEffect(() => {
        fetchAcademicData()
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        setIsLoadingHistory(true)
        try {
            const params: any = {
                date_from: historyFilters.date_from,
                date_to: historyFilters.date_to
            }
            if (historyFilters.class_id) params.class_id = historyFilters.class_id
            if (historyFilters.status !== 'all') params.status = historyFilters.status

            const data = await attendanceService.getAttendanceRecords(params)
            setHistoryRecords(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoadingHistory(false)
        }
    }

    useEffect(() => {
        if (selectedClass) {
            fetchSections(parseInt(selectedClass))
        } else {
            setSections([])
        }
    }, [selectedClass])

    const fetchAcademicData = async () => {
        try {
            const classData = await academicService.getClasses()
            setClasses(classData)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const fetchSections = async (classId: number) => {
        try {
            const sectionData = await academicService.getSections(classId)
            setSections(sectionData)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const handleFetchStudents = async () => {
        if (!selectedClass || !selectedSection || !date) {
            toast.error('Please select class, section and date')
            return
        }

        setIsLoadingStudents(true)
        setIsEditing(false)
        try {
            const data = await attendanceService.getStudentsForMarking(
                parseInt(selectedClass),
                parseInt(selectedSection),
                date
            )
            setStudents(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
        setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s))
    }

    const handleRemarksChange = (studentId: number, remarks: string) => {
        setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, remarks } : s))
    }

    const handleMarkAll = (status: 'present' | 'absent') => {
        setStudents(prev => prev.map(s => ({ ...s, status })))
    }

    const handleSave = async () => {
        const unMarked = students.filter(s => !s.status)
        if (unMarked.length > 0) {
            toast.warning(`Please mark attendance for all students (${unMarked.length} remaining)`)
            return
        }

        setIsSaving(true)
        try {
            await attendanceService.markAttendance({
                date,
                class_id: parseInt(selectedClass),
                section_id: parseInt(selectedSection),
                attendance: students.map(s => ({
                    student_id: s.student_id,
                    status: s.status!,
                    remarks: s.remarks
                }))
            })
            toast.success('Attendance saved successfully')
            setIsEditing(false)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const user = useAuthStore((state) => state.user)
    const activeSectionObj = sections.find(s => s.id.toString() === selectedSection)

    // Permission: Admin can do anything. Teachers can ONLY mark their assigned section.
    const canMarkAttendance = user?.role === 'admin' ||
        (user?.role === 'teacher' && user.teacher_profile_id === activeSectionObj?.class_teacher)

    // Note: To be 100% sure, we compare usernames or user IDs. 
    // In our system, the User model has the school and role.
    const isRestrictedTeacher = user?.role === 'teacher' && !canMarkAttendance

    const filteredStudents = students
        .filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Natural sort for roll numbers (if they are numeric strings)
            const rollA = a.admission_number || ''
            const rollB = b.admission_number || ''
            return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' })
        })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                <p className="text-muted-foreground mt-1">
                    Mark and manage student attendance
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
                            <CardTitle className="text-lg">Select Class & Date</CardTitle>
                            <CardDescription>Choose the criteria to mark attendance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Class</Label>
                                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select onValueChange={setSelectedSection} value={selectedSection} disabled={!selectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(sec => (
                                                <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            max={format(new Date(), 'yyyy-MM-dd')}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleFetchStudents} className="gap-2">
                                    <Search className="h-4 w-4" /> Fetch Students
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {students.length > 0 && (
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
                                <div className="space-y-1">
                                    <CardTitle>Attendance List</CardTitle>
                                    <CardDescription>
                                        {students.length} students in {classes.find(c => c.id.toString() === selectedClass)?.name} - {sections.find(s => s.id.toString() === selectedSection)?.name}
                                        {isRestrictedTeacher && (
                                            <span className="block text-destructive font-semibold mt-1">
                                                (Read-Only: Only the assigned Class Teacher or Admin can mark attendance)
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search name or roll no..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {!isEditing && canMarkAttendance ? (
                                            <Button
                                                onClick={() => setIsEditing(true)}
                                                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-semibold shadow-md px-6 rounded-full hover:scale-105 active:scale-95"
                                            >
                                                <Pencil className="h-4 w-4" /> Edit Attendance
                                            </Button>
                                        ) : isEditing ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkAll('present')}
                                                    disabled={isRestrictedTeacher}
                                                    className="text-success hover:text-success hover:bg-success/10 flex-1 md:flex-none"
                                                >
                                                    Mark All Present
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkAll('absent')}
                                                    disabled={isRestrictedTeacher}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 md:flex-none"
                                                >
                                                    Mark All Absent
                                                </Button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground border-y">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-semibold">Roll No / ID</th>
                                                <th className="px-6 py-3 text-left font-semibold">Student Name</th>
                                                <th className="px-6 py-3 text-center font-semibold">Status</th>
                                                <th className="px-6 py-3 text-left font-semibold">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                                        No students found matching your search criteria.
                                                    </td>
                                                </tr>
                                            ) : filteredStudents.map((student) => (
                                                <tr key={student.student_id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs font-semibold">
                                                        {student.admission_number}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-foreground">{student.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {[
                                                                { id: 'present', icon: CheckCircle2, activeClass: 'text-success bg-success/10 border-success/30' },
                                                                { id: 'absent', icon: XCircle, activeClass: 'text-destructive bg-destructive/10 border-destructive/30' },
                                                                { id: 'late', icon: Clock, activeClass: 'text-warning bg-warning/10 border-warning/30' },
                                                                { id: 'excused', icon: AlertCircle, activeClass: 'text-info bg-info/10 border-info/30' },
                                                            ].map((opt) => {
                                                                const Icon = opt.icon
                                                                const isActive = student.status === opt.id

                                                                if (!isEditing && !isActive) return null; // Only show active status when not editing

                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={() => isEditing && !isRestrictedTeacher && handleStatusChange(student.student_id, opt.id as any)}
                                                                        disabled={!isEditing || isRestrictedTeacher}
                                                                        className={cn(
                                                                            "p-2 rounded-lg border border-transparent transition-all capitalize flex flex-col items-center gap-1 min-w-[60px]",
                                                                            isActive ? opt.activeClass : "hover:bg-muted text-muted-foreground",
                                                                            (!isEditing || isRestrictedTeacher) && "cursor-default"
                                                                        )}
                                                                    >
                                                                        <Icon className="h-5 w-5" />
                                                                        <span className="text-[10px] font-medium">{opt.id}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                            {!isEditing && !student.status && (
                                                                <span className="text-muted-foreground text-xs italic">Not Marked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Input
                                                            placeholder="Notes..."
                                                            value={student.remarks}
                                                            onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                            className="h-8 text-xs"
                                                            disabled={isRestrictedTeacher || !isEditing}
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
                                    {students.filter(s => s.status === 'present').length} Present, {students.filter(s => s.status === 'absent').length} Absent
                                </div>
                                {isEditing && (
                                    <Button onClick={handleSave} disabled={isSaving || isRestrictedTeacher} className="gap-2 px-8">
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {isRestrictedTeacher ? 'Marking Restricted' : 'Save Attendance'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )}

                    {isLoadingStudents && (
                        <div className="space-y-4">
                            <Skeleton className="h-[400px] w-full" />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">History Filters</CardTitle>
                            <CardDescription>Filter past records by date range and class</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Date From</Label>
                                    <Input
                                        type="date"
                                        value={historyFilters.date_from}
                                        onChange={(e) => setHistoryFilters({ ...historyFilters, date_from: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date To</Label>
                                    <Input
                                        type="date"
                                        value={historyFilters.date_to}
                                        onChange={(e) => setHistoryFilters({ ...historyFilters, date_to: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Class</Label>
                                    <Select
                                        value={historyFilters.class_id}
                                        onValueChange={(v) => setHistoryFilters({ ...historyFilters, class_id: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={historyFilters.status}
                                        onValueChange={(v) => setHistoryFilters({ ...historyFilters, status: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="present">Present</SelectItem>
                                            <SelectItem value="absent">Absent</SelectItem>
                                            <SelectItem value="late">Late</SelectItem>
                                            <SelectItem value="excused">Excused</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={fetchHistory} variant="secondary" className="gap-2">
                                    <Search className="h-4 w-4" /> Filter History
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="border rounded-xl bg-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Student</th>
                                    <th className="px-6 py-4 font-medium">Class / Section</th>
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
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No records found for the selected criteria.</td></tr>
                                ) : historyRecords.map((rec: any) => (
                                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{format(new Date(rec.date), 'dd MMM yyyy')}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-foreground">{rec.student_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{rec.admission_number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{rec.class_name} - {rec.section_name}</td>
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
