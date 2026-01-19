import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { GraduationCap, User, Phone, Mail, Lock, MapPin, Loader2, CheckCircle2, Building2 } from 'lucide-react'
import { teacherService } from '@/services/teacherService'
import { schoolService } from '@/services/schoolService'
import type { PublicSchool } from '@/types'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const registrationSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  specialization: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  school_id: z.string().min(1, 'Please select a school'),
  school_verification_code: z.string().min(1, 'Verification code is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
})

type RegistrationFormData = z.infer<typeof registrationSchema>

export default function TeacherRegistrationPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [schools, setSchools] = useState<PublicSchool[]>([])
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  })

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await schoolService.getPublicSchools()
        setSchools(data)
      } catch (error) {
        toast.error('Failed to load schools. Please refresh the page.')
      } finally {
        setIsSchoolsLoading(false)
      }
    }
    fetchSchools()
  }, [])

  const nextStep = async () => {
    let fields: (keyof RegistrationFormData)[] = []
    if (step === 1) {
      fields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth']
    } else if (step === 2) {
      fields = ['qualification', 'specialization', 'address', 'school_id', 'school_verification_code']
    }

    const isValid = await trigger(fields)
    if (isValid) setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    try {
      // transform school_id to number for backend
      const payload = {
        ...data,
        school_id: parseInt(data.school_id)
      }
      await teacherService.registerTeacher(payload as any)
      setIsSuccess(true)
      toast.success('Registration successful! Please wait for admin approval.')
    } catch (error) {
      const message = getErrorMessage(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Registration Submitted!</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your application has been received and is currently under review by the school administration.
            You will receive an email once your account is approved.
          </p>
        </div>
        <Button asChild size="lg" className="mt-6">
          <Link to="/login">Back to Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">School ERP</h1>
      </div>

      <Card className="border-border/50 shadow-xl shadow-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl">Teacher Registration</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 3</span>
          </div>
          <CardDescription>
            {step === 1 && "Personal details to identify you"}
            {step === 2 && "Professional information and school association"}
            {step === 3 && "Secure your account with a password"}
          </CardDescription>

          {/* Progress Bar */}
          <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden">
            <motion.div
              className="bg-primary h-full"
              initial={{ width: '33.33%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 py-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        placeholder="John"
                        icon={<User className="h-4 w-4" />}
                        {...register('first_name')}
                        error={!!errors.first_name}
                      />
                      {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        placeholder="Doe"
                        icon={<User className="h-4 w-4" />}
                        {...register('last_name')}
                        error={!!errors.last_name}
                      />
                      {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      icon={<Mail className="h-4 w-4" />}
                      {...register('email')}
                      error={!!errors.email}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+91-XXXXXXXXXX"
                        icon={<Phone className="h-4 w-4" />}
                        {...register('phone')}
                        error={!!errors.phone}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        {...register('date_of_birth')}
                        error={!!errors.date_of_birth}
                      />
                      {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Full Qualification</Label>
                    <Input
                      id="qualification"
                      placeholder="M.A. Mathematics, B.Ed"
                      {...register('qualification')}
                      error={!!errors.qualification}
                    />
                    {errors.qualification && <p className="text-xs text-destructive">{errors.qualification.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization (Optional)</Label>
                    <Input
                      id="specialization"
                      placeholder="Calculus, Algebra"
                      {...register('specialization')}
                      error={!!errors.specialization}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      placeholder="House No, Street, City"
                      icon={<MapPin className="h-4 w-4" />}
                      {...register('address')}
                      error={!!errors.address}
                    />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="space-y-2">
                      <Label htmlFor="school_id" className="text-primary font-semibold">Associated School</Label>
                      <Controller
                        name="school_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isSchoolsLoading}
                          >
                            <SelectTrigger id="school_id" className="bg-background">
                              <SelectValue placeholder={isSchoolsLoading ? "Loading schools..." : "Select your school"} />
                            </SelectTrigger>
                            <SelectContent>
                              {schools.map((school) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {school.logo ? (
                                      <img src={school.logo} alt={school.name} className="w-5 h-5 object-contain" />
                                    ) : (
                                      <Building2 className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span>{school.name}</span>
                                    <span className="text-xs text-muted-foreground ml-1">({school.city})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.school_id && <p className="text-xs text-destructive">{errors.school_id.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school_verification_code" className="text-primary font-semibold">School Verification Code</Label>
                      <p className="text-xs text-muted-foreground mb-2">Required: Get this code from your school administrator</p>
                      <Input
                        id="school_verification_code"
                        placeholder="XXXXXX-XXX"
                        className="bg-background"
                        {...register('school_verification_code')}
                        error={!!errors.school_verification_code}
                      />
                      {errors.school_verification_code && <p className="text-xs text-destructive">{errors.school_verification_code.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      icon={<Lock className="h-4 w-4" />}
                      {...register('password')}
                      error={!!errors.password}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirm">Confirm Password</Label>
                    <Input
                      id="password_confirm"
                      type="password"
                      placeholder="••••••••"
                      icon={<Lock className="h-4 w-4" />}
                      {...register('password_confirm')}
                      error={!!errors.password_confirm}
                    />
                    {errors.password_confirm && <p className="text-xs text-destructive">{errors.password_confirm.message}</p>}
                  </div>
                  <div className="rounded-lg bg-orange-50 border border-orange-100 p-4 text-orange-800 text-sm">
                    <p className="font-medium">Important Note:</p>
                    <p className="mt-1">
                      By registering, you agree that your account will remain inactive until it is manually verified and approved by your school's administrator.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border/50 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? () => navigate('/login') : prevStep}
              disabled={isLoading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
