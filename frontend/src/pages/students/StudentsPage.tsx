import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  User,
  Phone,
  GraduationCap,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { studentService } from '@/services/studentService'
import { academicService } from '@/services/academicService'
import { getErrorMessage } from '@/services/api'
import type { Student, Class, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    class_id: '',
    section_id: '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents()
    }, 500)
    return () => clearTimeout(timer)
  }, [filters])

  const fetchInitialData = async () => {
    try {
      const classesData = await academicService.getClasses()
      setClasses(classesData)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const params: any = {}
      if (filters.search) params.search = filters.search
      if (filters.class_id && filters.class_id !== 'all') params.class_id = filters.class_id
      if (filters.section_id && filters.section_id !== 'all') params.section_id = filters.section_id

      const response = await studentService.getStudents(params)
      setStudents(response)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClassChange = async (value: string) => {
    setFilters(prev => ({ ...prev, class_id: value, section_id: 'all' }))
    if (value && value !== 'all') {
      try {
        const sectionsData = await academicService.getSections(Number(value))
        setSections(sectionsData)
      } catch (error) {
        console.error('Error fetching sections:', error)
      }
    } else {
      setSections([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage student records and admissions.
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/students/admission')}>
          <Plus className="h-4 w-4" />
          New Admission
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <Select value={filters.class_id} onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.section_id}
              onValueChange={(val) => setFilters(prev => ({ ...prev, section_id: val }))}
              disabled={!filters.class_id || filters.class_id === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2" onClick={() => setFilters({ search: '', class_id: 'all', section_id: 'all' })}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : students.length > 0 ? (
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Admission No</th>
                    <th className="px-6 py-4 font-medium">Class/Section</th>
                    <th className="px-6 py-4 font-medium">Parent Contact</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {student.first_name || 'Unknown'} {student.last_name || ''}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.email || student.phone || 'No contact info'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{student.admission_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{student.class_name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{student.section_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{student.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={student.status === 'active' ? 'outline' : 'secondary'} className={student.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                          {student.status}
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
                            <DropdownMenuItem onClick={() => navigate(`/students/${student.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/students/${student.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No students found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or add a new student.</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/students/admission')}>
              New Admission
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
