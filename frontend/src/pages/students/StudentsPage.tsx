import { useState, useEffect } from 'react'
import { Plus, Users, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { studentService } from '@/services/studentService'
import { academicService } from '@/services/academicService'
import { getErrorMessage } from '@/services/api'
import type { Student, GroupedFormConfig, AdmissionFormConfig, Class, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DynamicFormField } from '@/components/forms/DynamicFormField'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from "@/components/ui/scroll-area"

const SECTION_LABELS: Record<string, string> = {
  'basic': 'Basic Information',
  'personal': 'Personal Information',
  'contact': 'Contact Information',
  'emergency': 'Emergency Contact',
  'medical': 'Medical Information',
  'academic': 'Academic Information',
  'documents': 'Documents',
  'transport': 'Transport',
  'hostel': 'Hostel',
  'parent': 'Parent Information',
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [formConfig, setFormConfig] = useState<GroupedFormConfig>({})
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigLoading, setIsConfigLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    academic: true,
  })

  const { handleSubmit, setValue, watch, formState: { errors }, setError, clearErrors, reset: resetForm } = useForm()
  const formData = watch()

  useEffect(() => {
    fetchStudents()
    fetchFormConfig()
    fetchClasses()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const data = await studentService.getStudents()
      setStudents(data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFormConfig = async () => {
    setIsConfigLoading(true)
    try {
      const data = await studentService.getFormConfigBySection()
      setFormConfig(data)
    } catch (error) {
      console.error('Failed to fetch form config:', error)
    } finally {
      setIsConfigLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const data = await academicService.getClasses()
      setClasses(data)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchSections = async (classId: number) => {
    try {
      const data = await academicService.getSections(classId)
      setSections(data)
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    }
  }

  const handleEditStudent = async (student: Student) => {
    setViewingStudent(null)
    setEditingStudent(student)
    setIsEditing(true)
    setIsOpen(true)

    // Pre-fill form
    resetForm(student)

    // Ensure sections are loaded for their class
    if (student.class_obj) {
      fetchSections(student.class_obj)
    }
  }

  const onSubmit = async (data: any) => {
    // Validate required fields based on form config
    let hasErrors = false
    Object.entries(formConfig).forEach(([_section, fields]) => {
      fields.forEach((config: AdmissionFormConfig) => {
        if (config.is_visible && config.is_required) {
          const value = data[config.field_name]
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            setError(config.field_name, {
              type: 'required',
              message: `${config.field_label} is required`
            })
            hasErrors = true
          }
        }
      })
    })

    if (hasErrors) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && editingStudent) {
        await studentService.updateStudent(editingStudent.id, data)
        toast.success('Student record updated successfully')
      } else {
        await studentService.createStudent(data)
        toast.success('Student admitted successfully')
      }
      setIsOpen(false)
      setIsEditing(false)
      setEditingStudent(null)
      fetchStudents()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const renderFormSection = (section: string, fields: AdmissionFormConfig[]) => {
    const visibleFields = fields.filter(f => f.is_visible)
    if (visibleFields.length === 0) return null

    const isExpanded = expandedSections[section]

    return (
      <div key={section} className="border rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{SECTION_LABELS[section] || section}</h3>
            <span className="text-xs text-muted-foreground">
              ({visibleFields.filter(f => f.is_required).length} required)
            </span>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleFields.map((config) => {
              // Handle special fields like class and section
              if (config.field_name === 'class_obj') {
                return (
                  <div key={config.field_name} className="space-y-2">
                    <label className="text-sm font-medium">
                      {config.field_label}
                      {config.is_required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.class_obj || ''}
                      onChange={(e) => {
                        const classId = Number(e.target.value)
                        setValue('class_obj', classId)
                        if (classId) fetchSections(classId)
                      }}
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors[config.field_name] && (
                      <p className="text-xs text-destructive">{errors[config.field_name]?.message as string}</p>
                    )}
                  </div>
                )
              }

              if (config.field_name === 'section') {
                return (
                  <div key={config.field_name} className="space-y-2">
                    <label className="text-sm font-medium">
                      {config.field_label}
                      {config.is_required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.section || ''}
                      onChange={(e) => setValue('section', Number(e.target.value))}
                      disabled={!formData.class_obj}
                    >
                      <option value="">Select Section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors[config.field_name] && (
                      <p className="text-xs text-destructive">{errors[config.field_name]?.message as string}</p>
                    )}
                  </div>
                )
              }

              return (
                <DynamicFormField
                  key={config.field_name}
                  config={config}
                  value={formData[config.field_name]}
                  onChange={(value) => {
                    setValue(config.field_name, value)
                    clearErrors(config.field_name)
                  }}
                  error={errors[config.field_name]?.message as string}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Students
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage student admissions and records
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setIsEditing(false)
            setEditingStudent(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Admit Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{isEditing ? 'Edit Student Record' : 'Admit New Student'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update student information below.' : 'Fill in the student information below.'} Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              {isConfigLoading ? (
                <div className="space-y-4 py-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <form id="admissionForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                  {Object.entries(formConfig).map(([section, fields]) =>
                    renderFormSection(section, fields)
                  )}
                </form>
              )}
            </div>

            <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="admissionForm" disabled={isSaving || isConfigLoading}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Student' : 'Admit Student'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>View and manage enrolled students</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.admission_number} • {student.class_name} - {student.section_name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewingStudent(student)}>
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No students found. Admit your first student to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Details Modal */}
      <Dialog open={viewingStudent !== null} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{viewingStudent?.full_name}</DialogTitle>
            <DialogDescription>
              Admission No: {viewingStudent?.admission_number} | {viewingStudent?.class_name} - {viewingStudent?.section_name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2 border-b pb-1">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Date of Birth:</span> <span>{viewingStudent?.date_of_birth}</span>
                    <span className="text-muted-foreground">Gender:</span> <span className="capitalize">{viewingStudent?.gender}</span>
                    <span className="text-muted-foreground">Blood Group:</span> <span>{viewingStudent?.blood_group || 'N/A'}</span>
                    <span className="text-muted-foreground">Category:</span> <span className="capitalize">{viewingStudent?.category || 'General'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2 border-b pb-1">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Email:</span> <span>{viewingStudent?.email || 'N/A'}</span>
                    <span className="text-muted-foreground">Phone:</span> <span>{viewingStudent?.phone || 'N/A'}</span>
                    <span className="text-muted-foreground">Address:</span> <span className="col-span-1">{viewingStudent?.address}</span>
                    <span className="text-muted-foreground">City/State:</span> <span>{viewingStudent?.city}, {viewingStudent?.state}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2 border-b pb-1">Academic Information</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Admission Date:</span> <span>{viewingStudent?.admission_date}</span>
                    <span className="text-muted-foreground">Roll Number:</span> <span>{viewingStudent?.roll_number || 'Not assigned'}</span>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={viewingStudent?.status === 'active' ? 'default' : 'secondary'} className="w-fit scale-90">
                      {viewingStudent?.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2 border-b pb-1">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Name:</span> <span>{viewingStudent?.emergency_contact_name || 'N/A'}</span>
                    <span className="text-muted-foreground">Relation:</span> <span>{viewingStudent?.emergency_contact_relation || 'N/A'}</span>
                    <span className="text-muted-foreground">Phone:</span> <span>{viewingStudent?.emergency_contact_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => setViewingStudent(null)}>Close</Button>
            <Button onClick={() => {
              if (viewingStudent) handleEditStudent(viewingStudent)
            }}>Edit Information</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
