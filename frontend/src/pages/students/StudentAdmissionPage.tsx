import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react'
import { studentService } from '@/services/studentService'
import { academicService } from '@/services/academicService'
import { getErrorMessage } from '@/services/api'
import type { Class, Section, GroupedFormConfig, AdmissionFormConfig } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const admissionSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  admission_number: z.string().min(1, 'Admission number is required').regex(/^[a-zA-Z0-9-/]+$/, 'Only alphanumeric, hyphen, and slash allowed'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  blood_group: z.string().optional(),
  aadhaar_number: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number (10 digits starting with 6-9)').optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Invalid pincode'),
  admission_date: z.string().min(1, 'Admission date is required'),
  class_obj: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  previous_school: z.string().optional(),
  previous_class: z.string().optional(),
  parents: z.array(z.object({
    name: z.string().min(2, 'Parent name is required'),
    relation: z.enum(['father', 'mother', 'guardian']),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number (10 digits starting with 6-9)'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    occupation: z.string().optional(),
    is_primary: z.boolean().default(false),
  })).min(1, 'At least one parent detail is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

type AdmissionFormData = z.infer<typeof admissionSchema>

export default function StudentAdmissionPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [activeTab, setActiveTab] = useState('personal')
  const [formConfig, setFormConfig] = useState<GroupedFormConfig>({})

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      gender: 'male',
      admission_date: new Date().toISOString().split('T')[0],
      parents: [{ relation: 'father', is_primary: true }],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parents',
  })

  const selectedClass = watch('class_obj')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchSections(Number(selectedClass))
    }
  }, [selectedClass])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const [classesData, configData] = await Promise.all([
        academicService.getClasses(),
        studentService.getFormConfigBySection()
      ])
      setClasses(classesData)
      setFormConfig(configData)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSections = async (classId: number) => {
    try {
      const data = await academicService.getSections(classId)
      setSections(data)
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const onSubmit = async (data: AdmissionFormData) => {
    setIsLoading(true)
    try {
      await studentService.createStudent(data)
      toast.success('Student admitted successfully!')
      navigate('/students')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const isFieldVisible = (section: string, fieldName: string) => {
    const sectionFields = formConfig[section]
    if (!sectionFields) return true // Default visible if no config
    const field = sectionFields.find((f: AdmissionFormConfig) => f.field_name === fieldName)
    return field ? field.is_visible : true
  }

  const isFieldRequired = (section: string, fieldName: string) => {
    const sectionFields = formConfig[section]
    if (!sectionFields) return false
    const field = sectionFields.find((f: AdmissionFormConfig) => f.field_name === fieldName)
    return field ? field.is_required : false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Admission</h1>
          <p className="text-muted-foreground mt-1">Enroll a new student into the system.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-background border-b rounded-none w-full justify-start h-auto p-0 gap-6">
            <TabsTrigger
              value="personal"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 h-auto font-semibold"
            >
              Personal Details
            </TabsTrigger>
            <TabsTrigger
              value="academic"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 h-auto font-semibold"
            >
              Academic Info
            </TabsTrigger>
            <TabsTrigger
              value="parents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 h-auto font-semibold"
            >
              Parent Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic details of the student.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" placeholder="Rahul" {...register('first_name')} />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" placeholder="Sharma" {...register('last_name')} />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth {isFieldRequired('personal', 'date_of_birth') && '*'}</Label>
                  <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                  {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
                </div>
                {isFieldVisible('personal', 'gender') && (
                  <div className="space-y-2">
                    <Label>Gender {isFieldRequired('personal', 'gender') && '*'}</Label>
                    <Select onValueChange={(val) => setValue('gender', val as any)} defaultValue="male">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {isFieldVisible('personal', 'blood_group') && (
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group {isFieldRequired('personal', 'blood_group') && '*'}</Label>
                    <Input id="blood_group" placeholder="O+" {...register('blood_group')} />
                  </div>
                )}
                {isFieldVisible('personal', 'aadhaar_number') && (
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar_number">Aadhaar Number {isFieldRequired('personal', 'aadhaar_number') && '*'}</Label>
                    <Input id="aadhaar_number" placeholder="XXXX-XXXX-XXXX" {...register('aadhaar_number')} />
                  </div>
                )}
                {isFieldVisible('contact', 'email') && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email {isFieldRequired('contact', 'email') ? '*' : '(Optional)'}</Label>
                    <Input id="email" type="email" placeholder="rahul@example.com" {...register('email')} />
                  </div>
                )}
                {isFieldVisible('contact', 'phone') && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone {isFieldRequired('contact', 'phone') ? '*' : '(Optional)'}</Label>
                    <Input id="phone" placeholder="+91-XXXXXXXXXX" {...register('phone')} />
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Street Name" {...register('address')} />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Mumbai" {...register('city')} />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Maharashtra" {...register('state')} />
                  {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" placeholder="400001" {...register('pincode')} />
                  {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="button" onClick={() => setActiveTab('academic')}>Next: Academic Info</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>Enrollment and school history.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="admission_number">Admission Number</Label>
                  <Input id="admission_number" placeholder="ADM/2026/001" {...register('admission_number')} />
                  {errors.admission_number && <p className="text-xs text-destructive">{errors.admission_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <Input id="admission_date" type="date" {...register('admission_date')} />
                  {errors.admission_date && <p className="text-xs text-destructive">{errors.admission_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select onValueChange={(val) => setValue('class_obj', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class_obj && <p className="text-xs text-destructive">{errors.class_obj.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    onValueChange={(val) => setValue('section', val)}
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.section && <p className="text-xs text-destructive">{errors.section.message}</p>}
                </div>
                {isFieldVisible('academic', 'previous_school') && (
                  <div className="space-y-2">
                    <Label htmlFor="previous_school">Previous School {isFieldRequired('academic', 'previous_school') && '*'}</Label>
                    <Input id="previous_school" placeholder="Little Flowers School" {...register('previous_school')} />
                  </div>
                )}
                {isFieldVisible('academic', 'previous_class') && (
                  <div className="space-y-2">
                    <Label htmlFor="previous_class">Previous Class {isFieldRequired('academic', 'previous_class') && '*'}</Label>
                    <Input id="previous_class" placeholder="Class 9" {...register('previous_class')} />
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="password">Login Password (Optional)</Label>
                  <Input id="password" type="password" placeholder="Default: student123" {...register('password')} />
                  <p className="text-xs text-muted-foreground">This password will be used for the student's portal login.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab('personal')}>Previous: Personal</Button>
                <Button type="button" onClick={() => setActiveTab('parents')}>Next: Parent Details</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="parents" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Parent/Guardian Details</CardTitle>
                  <CardDescription>Contact information for family members.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ relation: 'mother', name: '', phone: '', is_primary: false })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Parent
                </Button>
              </CardHeader>
              <CardContent className="space-y-8">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Parent {index + 1}</h4>
                      {index > 0 && (
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Relationship</Label>
                        <Select onValueChange={(val) => setValue(`parents.${index}.relation`, val as any)} defaultValue={field.relation}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Relation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="father">Father</SelectItem>
                            <SelectItem value="mother">Mother</SelectItem>
                            <SelectItem value="guardian">Guardian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <Label>Guardian Name</Label>
                        <Input placeholder="Full Name" {...register(`parents.${index}.name`)} />
                        {errors.parents?.[index]?.name && <p className="text-xs text-destructive">{errors.parents[index]?.name?.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="+91-XXXXXXXXXX" {...register(`parents.${index}.phone`)} />
                        {errors.parents?.[index]?.phone && <p className="text-xs text-destructive">{errors.parents[index]?.phone?.message}</p>}
                      </div>
                      {isFieldVisible('parent', 'email') && (
                        <div className="space-y-2">
                          <Label>Email {isFieldRequired('parent', 'email') && '*'}</Label>
                          <Input placeholder="email@example.com" {...register(`parents.${index}.email`)} />
                        </div>
                      )}
                      {isFieldVisible('parent', 'occupation') && (
                        <div className="space-y-2">
                          <Label>Occupation {isFieldRequired('parent', 'occupation') && '*'}</Label>
                          <Input placeholder="Business / Salaried" {...register(`parents.${index}.occupation`)} />
                        </div>
                      )}
                      <div className="lg:col-span-3 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`primary-${index}`}
                          {...register(`parents.${index}.is_primary`)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`primary-${index}`}>Primary Contact for SMS/Communication</Label>
                      </div>
                    </div>
                  </div>
                ))}
                {errors.parents?.message && <p className="text-sm text-destructive">{errors.parents.message}</p>}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setActiveTab('academic')}>Previous: Academic</Button>
                <div className="gap-3 flex">
                  <Button type="button" variant="ghost" onClick={() => navigate('/students')}>Cancel</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Admission'
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
