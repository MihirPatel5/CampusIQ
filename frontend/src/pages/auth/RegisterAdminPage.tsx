import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Mail, Lock, Phone, Loader2, Building2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const registerSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Invalid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ["password_confirm"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterAdminPage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)
        try {
            const response = await authService.registerAdmin(data)

            if (response.verified) {
                toast.info('Account already verified. Please sign in.')
                navigate('/login')
                return
            }

            toast.success('Registration successful! Use OTP: 123456 to verify your email.')
            // Navigate to OTP page with email in state
            navigate('/verify-otp', { state: { email: data.email } })
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto py-8">
            <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground">CampusIQ</h1>
            </div>

            <Card className="border-border/50 shadow-xl shadow-primary/5">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Create School Account</CardTitle>
                    <CardDescription className="text-center">
                        Register as a School Administrator to manage your institution
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    placeholder="John"
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
                                    {...register('last_name')}
                                    error={!!errors.last_name}
                                />
                                {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="johndoe"
                                icon={<User className="h-4 w-4" />}
                                {...register('username')}
                                error={!!errors.username}
                            />
                            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@school.com"
                                icon={<Mail className="h-4 w-4" />}
                                {...register('email')}
                                error={!!errors.email}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

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
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-border/50">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Register School'
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
