import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Save, Search, History, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { academicService } from '@/services/academicService'
import { attendanceService, type StudentForMarking } from '@/services/attendanceService'
import { getErrorMessage } from '@/services/api'
import type { Class, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchAcademicData()
    }, [])

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
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

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
                        <Card className="border-border/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Attendance List</CardTitle>
                                    <CardDescription>
                                        {students.length} students in {classes.find(c => c.id.toString() === selectedClass)?.name} - {sections.find(s => s.id.toString() === selectedSection)?.name}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')} className="text-success hover:text-success hover:bg-success/10">
                                        Mark All Present
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        Mark All Absent
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground border-y">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium">Student Info</th>
                                                <th className="px-6 py-3 text-center font-medium">Status</th>
                                                <th className="px-6 py-3 text-left font-medium">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {students.map((student) => (
                                                <tr key={student.student_id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-foreground">{student.name}</p>
                                                            <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                                                        </div>
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
                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={() => handleStatusChange(student.student_id, opt.id as any)}
                                                                        className={cn(
                                                                            "p-2 rounded-lg border border-transparent transition-all capitalize flex flex-col items-center gap-1 min-w-[60px]",
                                                                            isActive ? opt.activeClass : "hover:bg-muted text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <Icon className="h-5 w-5" />
                                                                        <span className="text-[10px] font-medium">{opt.id}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Input
                                                            placeholder="Notes..."
                                                            value={student.remarks}
                                                            onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                            className="h-8 text-xs"
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
                                <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Attendance
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {isLoadingStudents && (
                        <div className="space-y-4">
                            <Skeleton className="h-[400px] w-full" />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance History</CardTitle>
                            <CardDescription>View past attendance records and reports</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg mx-6 mb-6">
                            <History className="h-10 w-10 mb-2 opacity-20" />
                            <p>Detailed history view is under construction.</p>
                            <p className="text-xs">Use the list view to see already marked status for the day.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
