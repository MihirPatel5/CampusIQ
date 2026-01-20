import { useState, useEffect } from 'react'
import { Plus, Layers, Loader2, MoreVertical, Edit, Trash2, Calendar, Code, User, BookOpen } from 'lucide-react'
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
import { ScrollArea } from "@/components/ui/scroll-area"

const classSchema = z.object({
    name: z.string().min(1, 'Class name is required'),
    code: z.string().min(1, 'Class code is required'),
    academic_year: z.string().min(4, 'Academic year is required'),
    description: z.string().optional(),
    sections_data: z.array(z.object({
        name: z.string().min(1, 'Section name is required'),
        class_teacher: z.string().optional().or(z.number().optional()), // ID can be number or string from Select
    })).optional()
})

type ClassFormData = z.infer<typeof classSchema>

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [editingClass, setEditingClass] = useState<Class | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ClassFormData>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            sections_data: [{ name: 'A', class_teacher: undefined }] // Default one section
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
                sections_data: [] // Editing existing class usually doesn't create new sections this way, logic might differ
            })
        } else {
            reset({
                name: '',
                code: '',
                academic_year: '2024-25',
                description: '',
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
            const response = await teacherService.getTeachers()
            const data = Array.isArray(response) ? response : response.results
            setTeachers(data)
        } catch (error) {
            console.error('Failed to fetch teachers', error)
        }
    }

    const onSubmit = async (data: ClassFormData) => {
        setIsSaving(true)
        try {
            // Convert teacher IDs to numbers if they are strings
            if (data.sections_data) {
                data.sections_data = data.sections_data.map(s => ({
                    ...s,
                    class_teacher: s.class_teacher ? Number(s.class_teacher) : undefined
                }))
            }

            if (editingClass) {
                await academicService.updateClass(editingClass.id, data)
                toast.success('Class updated successfully')
            } else {
                await academicService.createClass(data)
                toast.success('Class created successfully with sections')
            }
            setIsOpen(false)
            setEditingClass(null)
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
                    if (!open) setEditingClass(null)
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Class
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                            <DialogDescription>
                                {editingClass ? 'Update class details.' : 'Define a new class and its sections.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto pr-2">
                            <form id="classForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
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

                                <div className="space-y-2">
                                    <Label htmlFor="academic_year">Academic Year</Label>
                                    <Input id="academic_year" placeholder="2024-25" {...register('academic_year')} />
                                    {errors.academic_year && <p className="text-xs text-destructive">{errors.academic_year.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" placeholder="Optional description" {...register('description')} />
                                </div>

                                {/* Sections Section */}
                                {!editingClass && (
                                    <div className="space-y-4 pt-4 border-t border-dashed">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base">Sections</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', class_teacher: undefined })}>
                                                <Plus className="h-3 w-3 mr-1" /> Add Section
                                            </Button>
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
                                                        />
                                                        {errors.sections_data?.[index]?.name && (
                                                            <p className="text-[10px] text-destructive">{errors.sections_data[index]?.name?.message}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <Label className="text-xs">Class Teacher</Label>
                                                        <Select onValueChange={(val) => {
                                                            // We unfortunately need to use setValue manually for controlled Select in useFieldArray if we don't wrap it differently
                                                            // Or use Controller. For simplicity in this replacement, assume we can just bind via a hidden input or simple state if needed.
                                                            // BUT react-hook-form 'register' doesn't work on Select usually.
                                                            // Let's use Controller-like behavior by storing value yourself? 
                                                            // Proper way:
                                                            setValue(`sections_data.${index}.class_teacher`, val)
                                                        }}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select Teacher" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teachers.map(t => (
                                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                                        {t.user.first_name} {t.user.last_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" form="classForm" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingClass ? 'Update' : 'Create Class'}
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
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : classes.length > 0 ? (
                    classes.map((cls) => (
                        <Card key={cls.id} className="relative group overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-xl">{cls.name}</CardTitle>
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
                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirmId(cls.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Academic Year: {cls.academic_year}</span>
                                </div>
                                {cls.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {cls.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between pt-2">
                                    <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                                        {cls.status}
                                    </Badge>
                                    <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                                        View Sections
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center border rounded-xl bg-muted/20">
                        <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No classes found</h3>
                        <p className="text-muted-foreground mt-1">Add a class to start managing sections and students.</p>
                    </div>
                )}
            </div>

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
