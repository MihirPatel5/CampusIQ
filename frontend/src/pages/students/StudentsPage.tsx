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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    academic: true,
  })

  const { handleSubmit, setValue, watch, formState: { errors }, setError, clearErrors } = useForm()
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
      await studentService.createStudent(data)
      toast.success('Student admitted successfully')
      setIsOpen(false)
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

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Admit Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Admit New Student</DialogTitle>
              <DialogDescription>
                Fill in the student information below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>

            {isConfigLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4">
                <form id="admissionForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                  {Object.entries(formConfig).map(([section, fields]) =>
                    renderFormSection(section, fields)
                  )}
                </form>
              </ScrollArea>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="admissionForm" disabled={isSaving || isConfigLoading}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Admit Student
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
                  <Button variant="outline" size="sm">View Details</Button>
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
    </div>
  )
}
