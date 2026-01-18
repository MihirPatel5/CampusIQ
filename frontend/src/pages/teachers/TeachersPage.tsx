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
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { teacherService } from '@/services/teacherService'
import { getErrorMessage } from '@/services/api'
import type { Teacher } from '@/types'
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
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  
  // Rejection Dialog State
  const [rejectionId, setRejectionId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchTeachers()
    fetchPendingTeachers()
  }, [])

  const fetchTeachers = async () => {
    setIsLoading(true)
    try {
      const response = await teacherService.getTeachers()
      // getTeachers might return paginated or array
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Teacher
        </Button>
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
