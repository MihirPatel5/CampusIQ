import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Building2,
  Calendar,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { teacherService } from '@/services/teacherService'
import { academicService } from '@/services/academicService'
import { getErrorMessage } from '@/services/api'
import type { Teacher, Subject } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Label } from '@/components/ui/label'
import { ScrollArea } from "@/components/ui/scroll-area"

const teacherSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: z.string().optional(),
  date_of_birth: z.string().optional(), // Adjust if date object
  joining_date: z.string().min(1, 'Joining date is required'),
  address: z.string().min(5, 'Address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  subjects: z.array(z.number()).optional()
})

type TeacherFormData = z.infer<typeof teacherSchema>

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  // Rejection Dialog State
  const [rejectionId, setRejectionId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add Teacher Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      joining_date: new Date().toISOString().split('T')[0],
      subjects: []
    }
  })

  useEffect(() => {
    fetchTeachers()
    fetchPendingTeachers()
    fetchSubjects()
  }, [])

  const fetchTeachers = async () => {
    setIsLoading(true)
    try {
      const response = await teacherService.getTeachers()
      const data = Array.isArray(response) ? response : response.results
      setTeachers(data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPendingTeachers = async () => {
    try {
      const data = await teacherService.getPendingTeachers()
      setPendingTeachers(data)
    } catch (error) {
      console.error('Error fetching pending teachers:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const data = await academicService.getSubjects()
      setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await teacherService.approveTeacher(id)
      toast.success('Teacher approved successfully')
      fetchTeachers()
      fetchPendingTeachers()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleReject = async () => {
    if (!rejectionId) return
    setIsSubmitting(true)
    try {
      await teacherService.rejectTeacher(rejectionId, rejectionReason)
      toast.success('Teacher registration rejected')
      setRejectionId(null)
      setRejectionReason('')
      fetchPendingTeachers()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: TeacherFormData) => {
    setIsSaving(true)
    try {
      await teacherService.createTeacher(data as any) // Type assertion if API expects specific shape
      toast.success('Teacher account created successfully')
      setIsAddOpen(false)
      reset()
      fetchTeachers()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSubjects = watch('subjects') || []

  const toggleSubject = (subjectId: number) => {
    const current = selectedSubjects
    if (current.includes(subjectId)) {
      setValue('subjects', current.filter(id => id !== subjectId))
    } else {
      setValue('subjects', [...current, subjectId])
    }
  }

  const filteredTeachers = teachers.filter(t =>
    t.user.first_name.toLowerCase().includes(search.toLowerCase()) ||
    t.user.last_name.toLowerCase().includes(search.toLowerCase()) ||
    t.user.email.toLowerCase().includes(search.toLowerCase()) ||
    t.employee_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage teaching staff and approval requests.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) reset()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account and assign subjects.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <form id="addTeacherForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" {...register('first_name')} />
                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" {...register('last_name')} />
                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register('phone')} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" placeholder="e.g. M.Sc. Mathematics" {...register('qualification')} />
                    {errors.qualification && <p className="text-xs text-destructive">{errors.qualification.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" placeholder="e.g. Algebra" {...register('specialization')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="joining_date">Joining Date</Label>
                    <Input id="joining_date" type="date" {...register('joining_date')} />
                    {errors.joining_date && <p className="text-xs text-destructive">{errors.joining_date.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register('address')} />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>

                {/* Subjects Selection */}
                <div className="space-y-2">
                  <Label>Assign Subjects</Label>
                  <ScrollArea className="h-32 w-full rounded-md border p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.length > 0 ? subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`subject-${subject.id}`}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedSubjects.includes(subject.id)}
                            onChange={() => toggleSubject(subject.id)}
                          />
                          <label
                            htmlFor={`subject-${subject.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {subject.name} <span className="text-xs text-muted-foreground">({subject.code})</span>
                          </label>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground col-span-2">No subjects found. Add subjects in Academic section first.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </form>
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" form="addTeacherForm" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Active Staff
            <Badge variant="secondary" className="h-5 px-1.5">{teachers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending Requests
            {pendingTeachers.length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">{pendingTeachers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-12 w-full mt-4" />
                  </CardContent>
                </Card>
              ))
            ) : filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <Card key={teacher.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          {teacher.user.first_name} {teacher.user.last_name}
                        </CardTitle>
                        <CardDescription>{teacher.employee_id || 'ID Pending'}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{teacher.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{teacher.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{teacher.specialization || teacher.qualification}</span>
                      </div>
                      {/* Show Subjects if any */}
                      {/* Note: Teacher interface might not have subjects populated fully yet unless backend sends it. Use optional chaining */}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t pt-4 text-xs flex justify-between">
                    <span>Joined {new Date(teacher.joining_date).toLocaleDateString()}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Mark Inactive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
                <h3 className="text-lg font-medium">No active teachers found</h3>
                <p className="text-muted-foreground mt-1">Try searching for someone else.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingTeachers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingTeachers.map((teacher) => (
                <Card key={teacher.id} className="overflow-hidden border-orange-200 bg-orange-50/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                          <User className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">
                            {teacher.user.first_name} {teacher.user.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{teacher.user.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> {teacher.qualification}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(teacher.created_at || '').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                          variant="outline"
                          className="flex-1 md:flex-none border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => setRejectionId(teacher.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(teacher.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground mt-1">Pending registrations will appear here for your review.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={rejectionId !== null} onOpenChange={(open) => !open && setRejectionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Teacher Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this registration. This will be visible to the teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason for Rejection</Label>
            <Input
              id="reason"
              placeholder="e.g., Incomplete documentation, mismatch in credentials"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionId(null)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
