import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, BookOpen, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { academicService } from '@/services/academicService'
import { teacherService } from '@/services/teacherService'
import { getErrorMessage } from '@/services/api'
import type { Class, Section, Subject, Teacher, SubjectAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ClassSubjectManagerPage() {
    const { classId, sectionId } = useParams()
    const navigate = useNavigate()

    // Data State
    const [classData, setClassData] = useState<Class | null>(null)
    const [sectionData, setSectionData] = useState<Section | null>(null)
    const [assignments, setAssignments] = useState<SubjectAssignment[]>([])
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
    const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])

    // UI State
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    // Form State
    const [selectedSubject, setSelectedSubject] = useState<string>('')
    const [selectedTeacher, setSelectedTeacher] = useState<string>('')

    useEffect(() => {
        if (!classId || !sectionId) {
            toast.error("Invalid route parameters")
            navigate('/classes')
            return
        }
        fetchData()
    }, [classId, sectionId])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Parallel fetch for all required data
            const [classes, sections, assignmentsData, subjects, teachers] = await Promise.all([
                academicService.getClasses(),
                academicService.getSections(parseInt(classId!)),
                academicService.getSubjectAssignments({
                    class_id: parseInt(classId!),
                    section_id: parseInt(sectionId!)
                }),
                academicService.getSubjects(),
                teacherService.getTeachers()
            ])

            // Find current class and section objects
            const currentClass = classes.find(c => c.id === parseInt(classId!))
            const currentSection = sections.find(s => s.id === parseInt(sectionId!))

            if (!currentClass || !currentSection) {
                toast.error("Class or Section not found")
                navigate('/classes')
                return
            }

            setClassData(currentClass)
            setSectionData(currentSection)
            setAssignments(assignmentsData)
            setAvailableSubjects(subjects)
            setAvailableTeachers(teachers)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleAssignSubject = async () => {
        if (!selectedSubject || !selectedTeacher) {
            toast.error("Please select both a subject and a teacher")
            return
        }

        setIsSaving(true)
        try {
            await academicService.createSubjectAssignment({
                class_obj: parseInt(classId!),
                section: parseInt(sectionId!),
                subject: parseInt(selectedSubject),
                teacher: parseInt(selectedTeacher),
                academic_year: classData?.academic_year || '2024-25',
                status: 'active'
            })

            toast.success("Subject assigned successfully")
            setIsDialogOpen(false)
            setSelectedSubject('')
            setSelectedTeacher('')

            // Refund only assignments to be efficient
            const newAssignments = await academicService.getSubjectAssignments({
                class_id: parseInt(classId!),
                section_id: parseInt(sectionId!)
            })
            setAssignments(newAssignments)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirmId) return

        try {
            await academicService.deleteSubjectAssignment(deleteConfirmId)
            toast.success("Assignment removed")

            setAssignments(prev => prev.filter(a => a.id !== deleteConfirmId))
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setDeleteConfirmId(null)
        }
    }

    // Filter subjects that are already assigned
    const unassignedSubjects = availableSubjects.filter(
        sub => !assignments.some(a => a.subject === sub.id)
    )

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/classes')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Subject Allocation</h1>
                        <p className="text-muted-foreground mt-1">
                            {classData?.name} - Section {sectionData?.name} ({classData?.academic_year})
                        </p>
                    </div>
                </div>

                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Assign Subject
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <Card key={assignment.id} className="relative group hover:shadow-md transition-all border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <span>{assignment.subject_name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setDeleteConfirmId(assignment.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                                    <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider">Teacher</p>
                                        <p className="font-medium text-foreground">{assignment.teacher_name}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
                        <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-10" />
                        <h3 className="text-xl font-semibold">No subjects assigned</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                            Assign subjects and teachers to this section to enable timetable scheduling.
                        </p>
                        <Button variant="outline" className="mt-6" onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Assign First Subject
                        </Button>
                    </div>
                )}
            </div>

            {/* Assignment Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unassignedSubjects.map(sub => (
                                        <SelectItem key={sub.id} value={sub.id.toString()}>
                                            {sub.name} ({sub.code})
                                        </SelectItem>
                                    ))}
                                    {unassignedSubjects.length === 0 && (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No more subjects available.
                                            <br />
                                            <Button variant="link" onClick={() => navigate('/subjects')} className="h-auto p-0">
                                                Create new subject
                                            </Button>
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Teacher</Label>
                            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTeachers.map(teacher => (
                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                            {teacher.user.first_name} {teacher.user.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignSubject} disabled={isSaving || !selectedSubject || !selectedTeacher}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the subject from this class section. It might affect existing timetable entries.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
