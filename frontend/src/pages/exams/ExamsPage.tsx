import { useState, useEffect } from 'react'
import { Plus, Loader2, Calendar, ClipboardList, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { academicService } from '@/services/academicService'
import { examService } from '@/services/examService'
import { studentService } from '@/services/studentService'
import { getErrorMessage } from '@/services/api'
import type { Exam, Class, Subject } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // For Exam Dialog
    const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
    const [editingExam, setEditingExam] = useState<Exam | null>(null)
    const [examFormData, setExamFormData] = useState<Partial<Exam>>({
        name: '',
        exam_type: 'unit_test',
        academic_year: '2024-25',
        status: 'draft'
    })

    // For Result Entry
    const [selectedExamId, setSelectedExamId] = useState<string>('')
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
    const [students, setStudents] = useState<any[]>([])
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)

    useEffect(() => {
        fetchExams()
        fetchAcademicData()
    }, [])

    const fetchExams = async () => {
        setIsLoading(true)
        try {
            const data = await examService.getExams()
            setExams(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAcademicData = async () => {
        try {
            const [classData, subjectData] = await Promise.all([
                academicService.getClasses(),
                academicService.getSubjects()
            ])
            setClasses(classData)
            setSubjects(subjectData)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const handleFetchStudentsForResults = async () => {
        if (!selectedExamId || !selectedSubjectId) {
            toast.error('Please select an exam and a subject')
            return
        }

        const exam = exams.find(e => e.id.toString() === selectedExamId)
        if (!exam) return

        setIsLoadingStudents(true)
        try {
            const studentData = await studentService.getStudents({ class_id: exam.class_obj })

            // Fetch existing results for this exam/subject
            const existingResults = await examService.getResults({ exam_id: selectedExamId, subject_id: selectedSubjectId })
            const resultsMap = new Map(existingResults.map(r => [r.student.id, r]))

            setStudents(studentData.map(s => {
                const res = resultsMap.get(s.id)
                return {
                    id: s.id,
                    name: s.user ? `${s.user.first_name} ${s.user.last_name}` : (s.full_name || 'Unknown'),
                    admission_number: s.admission_number,
                    marks_obtained: res ? res.marks_obtained : '',
                    max_marks: res ? res.max_marks : 100,
                    remarks: res ? res.remarks : '',
                    already_entered: !!res
                }
            }))
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const handleResultChange = (studentId: number, field: string, value: any) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s))
    }

    const handleSaveResults = async () => {
        if (!selectedExamId || !selectedSubjectId) return

        setIsSaving(true)
        try {
            await examService.enterResultsBulk({
                exam_id: parseInt(selectedExamId),
                subject_id: parseInt(selectedSubjectId),
                results: students.map(s => ({
                    student_id: s.id,
                    marks_obtained: parseFloat(s.marks_obtained) || 0,
                    max_marks: parseFloat(s.max_marks) || 100,
                    remarks: s.remarks
                }))
            })
            toast.success('Results saved successfully')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleCreateOrUpdateExam = async () => {
        setIsSaving(true)
        try {
            if (editingExam) {
                await examService.updateExam(editingExam.id, examFormData)
                toast.success('Exam updated successfully')
            } else {
                await examService.createExam(examFormData)
                toast.success('Exam created successfully')
            }
            setIsExamDialogOpen(false)
            fetchExams()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="secondary">Draft</Badge>
            case 'active': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Active</Badge>
            case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>
            case 'published': return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">Published</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exams & Results</h1>
                    <p className="text-muted-foreground mt-1">
                        Schedule exams and manage student results
                    </p>
                </div>

                <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={() => {
                            setEditingExam(null)
                            setExamFormData({ name: '', exam_type: 'unit_test', academic_year: '2024-25', status: 'draft' })
                        }}>
                            <Plus className="h-4 w-4" />
                            Schedule Exam
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingExam ? 'Edit Exam' : 'Schedule New Exam'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Exam Name</Label>
                                <Input
                                    placeholder="e.g. Mid-Term 1 2024"
                                    value={examFormData.name}
                                    onChange={(e) => setExamFormData({ ...examFormData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={examFormData.exam_type}
                                        onValueChange={(v) => setExamFormData({ ...examFormData, exam_type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unit_test">Unit Test</SelectItem>
                                            <SelectItem value="mid_term">Mid-Term</SelectItem>
                                            <SelectItem value="final">Final</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Class</Label>
                                    <Select
                                        value={examFormData.class_obj?.toString()}
                                        onValueChange={(v) => setExamFormData({ ...examFormData, class_obj: parseInt(v) })}
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={examFormData.start_date || ''}
                                        onChange={(e) => setExamFormData({ ...examFormData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={examFormData.end_date || ''}
                                        onChange={(e) => setExamFormData({ ...examFormData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsExamDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateOrUpdateExam} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingExam ? 'Update Exam' : 'Schedule Exam'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="schedule" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="schedule" className="gap-2">
                        <Calendar className="h-4 w-4" /> Schedule
                    </TabsTrigger>
                    <TabsTrigger value="results" className="gap-2">
                        <ClipboardList className="h-4 w-4" /> Result Entry
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i}><Skeleton className="h-48 w-full" /></Card>
                            ))
                        ) : exams.map((exam) => (
                            <Card key={exam.id} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-lg">{exam.name}</CardTitle>
                                        <CardDescription>{classes.find(c => c.id === exam.class_obj)?.name || 'N/A'}</CardDescription>
                                    </div>
                                    {getStatusBadge(exam.status)}
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="capitalize">{exam.exam_type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dates:</span>
                                        <span>{exam.start_date} to {exam.end_date}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => {
                                        setEditingExam(exam)
                                        setExamFormData(exam)
                                        setIsExamDialogOpen(true)
                                    }}>
                                        Edit Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="results">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Bulk Result Entry</CardTitle>
                            <CardDescription>Select exam and subject to enter student marks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Exam</Label>
                                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exams.map(e => (
                                                <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleFetchStudentsForResults} className="gap-2">
                                    <Search className="h-4 w-4" /> Fetch Class Students
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {students.length > 0 && (
                        <Card className="mt-6 border-border/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Students List</CardTitle>
                                    <CardDescription>Enter marks for {subjects.find(s => s.id.toString() === selectedSubjectId)?.name}</CardDescription>
                                </div>
                                <Button onClick={handleSaveResults} disabled={isSaving} className="gap-2">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save All Results
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-y text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Student</th>
                                            <th className="px-6 py-3 text-center w-32">Marks Obtained</th>
                                            <th className="px-6 py-3 text-center w-32">Max Marks</th>
                                            <th className="px-6 py-3 text-left">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {students.map((s) => (
                                            <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium">{s.name}</p>
                                                    <p className="text-xs text-muted-foreground">{s.admission_number}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Input
                                                        type="number"
                                                        className="text-center"
                                                        value={s.marks_obtained}
                                                        onChange={(e) => handleResultChange(s.id, 'marks_obtained', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Input
                                                        type="number"
                                                        className="text-center"
                                                        value={s.max_marks}
                                                        onChange={(e) => handleResultChange(s.id, 'max_marks', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Input
                                                        placeholder="Optional notes"
                                                        value={s.remarks}
                                                        onChange={(e) => handleResultChange(s.id, 'remarks', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}

                    {isLoadingStudents && <div className="mt-8 space-y-4"><Skeleton className="h-64 w-full" /></div>}
                </TabsContent>
            </Tabs>
        </div>
    )
}
