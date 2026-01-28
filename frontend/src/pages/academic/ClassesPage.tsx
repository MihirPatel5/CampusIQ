import { useState, useEffect } from 'react'
import { Plus, Layers, Loader2, MoreVertical, Edit, Trash2, Calendar, Code, User, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { academicService } from '@/services/academicService'
import { teacherService } from '@/services/teacherService'
import { getErrorMessage } from '@/services/api'
import type { Class, Teacher } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const classSchema = z.object({
    name: z.string().min(1, 'Class name is required'),
    code: z.string().min(1, 'Class code is required'),
    academic_year: z.string().min(4, 'Academic year is required'),
    description: z.string().optional(),
    sections_data: z.array(z.object({
        id: z.number().optional(),
        name: z.string().min(1, 'Section name is required'),
        class_teacher: z.string().optional().or(z.number().optional()),
    })).optional(),
    class_teacher: z.string().optional().or(z.number().optional()),
})

type ClassFormData = z.infer<typeof classSchema>

import { useNavigate } from 'react-router-dom'

export default function ClassesPage() {
    const navigate = useNavigate()
    const [classes, setClasses] = useState<Class[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [editingClass, setEditingClass] = useState<Class | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
    const [viewingSectionsClass, setViewingSectionsClass] = useState<Class | null>(null)
    const [propagateTeacher, setPropagateTeacher] = useState(false)

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ClassFormData>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            academic_year: '2024-25',
            sections_data: [{ name: 'A', class_teacher: undefined }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "sections_data"
    })

    useEffect(() => {
        if (editingClass) {
            reset({
                name: editingClass.name,
                code: editingClass.code,
                academic_year: editingClass.academic_year,
                description: editingClass.description || '',
                // @ts-ignore
                class_teacher: editingClass.class_teacher?.toString() || '',
                // @ts-ignore
                sections_data: editingClass.sections?.map(s => ({
                    id: s.id,
                    name: s.name,
                    class_teacher: s.class_teacher?.toString() || ''
                })) || []
            })
        } else {
            reset({
                name: '',
                code: '',
                academic_year: '2024-25',
                description: '',
                class_teacher: '',
                sections_data: [{ name: 'A' }]
            })
        }
    }, [editingClass, reset])

    useEffect(() => {
        fetchClasses()
        fetchTeachers()
    }, [])

    const fetchClasses = async () => {
        setIsLoading(true)
        try {
            const data = await academicService.getClasses()
            setClasses(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTeachers = async () => {
        try {
            const data = await teacherService.getTeachers()
            setTeachers(data)
        } catch (error) {
            console.error('Failed to fetch teachers', error)
        }
    }

    const handleManageStudents = (cls: Class, sectionId?: number) => {
        let url = `/students?classId=${cls.id}`
        if (sectionId) url += `&sectionId=${sectionId}`
        navigate(url)
    }

    const onSubmit = async (data: ClassFormData) => {
        setIsSaving(true)
        try {
            const class_teacher_id = data.class_teacher && data.class_teacher !== 'none' ? Number(data.class_teacher) : null

            const sections_data = data.sections_data?.map(s => ({
                ...s,
                class_teacher: (propagateTeacher && !s.class_teacher) ? class_teacher_id : (s.class_teacher && s.class_teacher !== 'none' ? Number(s.class_teacher) : null)
            }))

            const payload = {
                ...data,
                class_teacher: class_teacher_id,
                sections_data
            }

            if (editingClass) {
                await academicService.updateClass(editingClass.id, payload as any)
                toast.success('Class updated successfully')
            } else {
                await academicService.createClass(payload as any)
                toast.success('Class created successfully with sections')
            }
            setIsOpen(false)
            setEditingClass(null)
            setPropagateTeacher(false)
            fetchClasses()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirmId) return
        try {
            await academicService.deleteClass(deleteConfirmId)
            toast.success('Class deleted successfully')
            fetchClasses()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setDeleteConfirmId(null)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage school classes and academic years
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) {
                        setEditingClass(null)
                        setPropagateTeacher(false)
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Class
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                            <DialogDescription>
                                {editingClass ? 'Update class details and section teachers.' : 'Define a new class and its sections.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-2">
                            <form id="classForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Class Name</Label>
                                        <Input id="name" placeholder="Class 10" {...register('name')} />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">Class Code</Label>
                                        <Input id="code" placeholder="C10" {...register('code')} />
                                        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="academic_year">Academic Year</Label>
                                        <Input id="academic_year" placeholder="2024-25" {...register('academic_year')} />
                                        {errors.academic_year && <p className="text-xs text-destructive">{errors.academic_year.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Class Teacher / Coordinator</Label>
                                        <Select
                                            value={watch('class_teacher')?.toString() || 'none'}
                                            onValueChange={(val) => {
                                                setValue('class_teacher', val)
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Coordinator" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Coordinator</SelectItem>
                                                {teachers.map(t => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        {t.user.first_name} {t.user.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {watch('class_teacher') && watch('class_teacher') !== 'none' && (
                                            <div className="flex items-center space-x-2 pt-1">
                                                <input
                                                    type="checkbox"
                                                    id="propagate"
                                                    checked={propagateTeacher}
                                                    onChange={(e) => setPropagateTeacher(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label htmlFor="propagate" className="text-[11px] text-muted-foreground cursor-pointer">
                                                    Apply this teacher to all sections
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" placeholder="Optional description" {...register('description')} />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base text-primary font-semibold">
                                            {editingClass ? 'Manage Sections' : 'Sections to Create'}
                                        </Label>
                                        {!editingClass && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', class_teacher: undefined })}>
                                                <Plus className="h-3 w-3 mr-1" /> Add Section
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg border">
                                                <div className="w-24 space-y-2">
                                                    <Label className="text-xs">Section</Label>
                                                    <Input
                                                        placeholder="A"
                                                        {...register(`sections_data.${index}.name` as const)}
                                                        className="h-9"
                                                        readOnly={!!editingClass}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Label className="text-xs">Section Teacher</Label>
                                                    <Select
                                                        value={watch(`sections_data.${index}.class_teacher`)?.toString() || 'none'}
                                                        onValueChange={(val) => {
                                                            setValue(`sections_data.${index}.class_teacher`, val)
                                                        }}
                                                        disabled={propagateTeacher}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Select Teacher" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Not Assigned</SelectItem>
                                                            {teachers.map(t => (
                                                                <SelectItem key={t.id} value={t.id.toString()}>
                                                                    {t.user.first_name} {t.user.last_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {!editingClass && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="mt-6 text-muted-foreground hover:text-destructive"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <DialogFooter className="p-6 border-t bg-muted/20">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" form="classForm" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingClass ? 'Update Class' : 'Create Class'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : classes.length > 0 ? (
                    classes.map((cls) => (
                        <Card key={cls.id} className="relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div onClick={() => handleManageStudents(cls)} className="cursor-pointer">
                                    <CardTitle className="text-xl font-bold hover:text-primary transition-colors">{cls.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Code className="h-3 w-3" /> {cls.code}
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setEditingClass(cls)
                                            setIsOpen(true)
                                        }}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Class
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirmId(cls.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>AY: {cls.academic_year}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>Coordinator: {cls.class_teacher_name || 'Not assigned'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t mt-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={cls.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                            {cls.status}
                                        </Badge>
                                        <Badge variant="outline" className="bg-primary/5">
                                            {cls.sections?.length || 0} Sections
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-primary hover:text-primary hover:bg-primary/10 font-semibold"
                                        onClick={() => setViewingSectionsClass(cls)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
                        <Layers className="h-14 w-14 mx-auto mb-4 opacity-10" />
                        <h3 className="text-xl font-semibold">No classes found</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add your first class to start organizing sections, teachers and students.</p>
                        <Button variant="outline" className="mt-6" onClick={() => setIsOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Your First Class
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={viewingSectionsClass !== null} onOpenChange={(open) => !open && setViewingSectionsClass(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">{viewingSectionsClass?.name} Sections</DialogTitle>
                                <DialogDescription>
                                    Managing {viewingSectionsClass?.code} for {viewingSectionsClass?.academic_year}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {viewingSectionsClass?.sections?.map((section: any) => (
                                <Card key={section.id} className="border-border/40 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-center">
                                            <Badge variant="outline" className="text-lg font-bold px-3 py-0.5">
                                                Section {section.name}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px]">
                                                {section.code}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-3">
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground leading-none mb-0.5">Section Teacher</span>
                                                <span className="font-medium text-foreground">
                                                    {section.class_teacher_name || 'Not Assigned'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-2 border-t">
                                            <span className="text-muted-foreground">Enrolled: <b className="text-foreground">{section.current_strength || 0}/40</b></span>
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-primary font-bold"
                                                size="sm"
                                                onClick={() => handleManageStudents(viewingSectionsClass, section.id)}
                                            >
                                                Manage Students
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t bg-muted/20">
                        <Button onClick={() => setViewingSectionsClass(null)}>Close View</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this class and all associated sections. Action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
