import { useState, useEffect } from 'react'
import { Plus, BookOpen, Loader2, MoreVertical, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { academicService } from '@/services/academicService'
import { getErrorMessage } from '@/services/api'
import type { Subject } from '@/types'
import { Button } from '@/components/ui/button'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

const subjectSchema = z.object({
    name: z.string().min(1, 'Subject name is required'),
    code: z.string().min(1, 'Subject code is required'),
    type: z.enum(['core', 'elective', 'optional']),
    max_marks: z.preprocess((val) => Number(val), z.number().min(0, 'Max marks must be positive')),
    description: z.string().optional(),
})

type SubjectFormData = z.infer<typeof subjectSchema>

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<SubjectFormData>({
        resolver: zodResolver(subjectSchema),
    })

    useEffect(() => {
        if (editingSubject) {
            reset({
                name: editingSubject.name,
                code: editingSubject.code,
                type: editingSubject.type,
                max_marks: editingSubject.max_marks,
                description: editingSubject.description || '',
            })
        } else {
            reset({
                name: '',
                code: '',
                type: 'core',
                max_marks: 100,
                description: '',
            })
        }
    }, [editingSubject, reset])

    useEffect(() => {
        fetchSubjects()
    }, [])

    const fetchSubjects = async () => {
        setIsLoading(true)
        try {
            const data = await academicService.getSubjects()
            setSubjects(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (data: SubjectFormData) => {
        setIsSaving(true)
        try {
            if (editingSubject) {
                await academicService.updateSubject(editingSubject.id, data)
                toast.success('Subject updated successfully')
            } else {
                await academicService.createSubject(data)
                toast.success('Subject created successfully')
            }
            setIsOpen(false)
            setEditingSubject(null)
            fetchSubjects()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirmId) return
        try {
            await academicService.deleteSubject(deleteConfirmId)
            toast.success('Subject deleted successfully')
            fetchSubjects()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setDeleteConfirmId(null)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'core': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'elective': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'optional': return 'bg-slate-100 text-slate-700 border-slate-200'
            default: return ''
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage course subjects and curriculum
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) setEditingSubject(null)
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Subject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                            <DialogDescription>
                                {editingSubject ? 'Update subject details.' : 'Define a new subject for the curriculum.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Subject Name</Label>
                                    <Input id="name" placeholder="Mathematics" {...register('name')} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Subject Code</Label>
                                    <Input id="code" placeholder="MATH" {...register('code')} />
                                    {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        onValueChange={(v) => setValue('type', v as any)}
                                        defaultValue={editingSubject?.type || 'core'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="core">Core</SelectItem>
                                            <SelectItem value="elective">Elective</SelectItem>
                                            <SelectItem value="optional">Optional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_marks">Max Marks</Label>
                                    <Input id="max_marks" type="number" placeholder="100" {...register('max_marks')} />
                                    {errors.max_marks && <p className="text-xs text-destructive">{errors.max_marks.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" placeholder="Optional description" {...register('description')} />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingSubject ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Subject</th>
                                <th className="px-6 py-4 font-medium">Code</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium text-center">Max Marks</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-border/50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : subjects.length > 0 ? (
                                subjects.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <BookOpen className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{sub.name}</p>
                                                    {sub.description && (
                                                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">{sub.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{sub.code}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={getTypeColor(sub.type)}>
                                                {sub.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{sub.max_marks}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={sub.status === 'active' ? 'outline' : 'secondary'} className={sub.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                                {sub.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                                {sub.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingSubject(sub)
                                                        setIsOpen(true)
                                                    }}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirmId(sub.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>No subjects found. Define your first subject.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this subject. This action cannot be undone.
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
