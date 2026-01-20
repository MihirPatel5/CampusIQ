import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
})

type OTPFormData = z.infer<typeof otpSchema>

export default function OTPVerificationPage() {
    const navigate = useNavigate()
    const location = useLocation()
    // Actually authProvider doesn't expose a manual setAuth method easily, 
    // but we can just redirect to dashboard as the backend returns tokens.
    // We'll manually store tokens and force a reload/re-check or use the login method if available. 
    // For now, let's just store tokens and redirect to onboard.

    const [isLoading, setIsLoading] = useState(false)
    const email = location.state?.email

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OTPFormData>({
        resolver: zodResolver(otpSchema),
    })

    useEffect(() => {
        if (!email) {
            toast.error('No email found. Please register again.')
            navigate('/register')
        }
    }, [email, navigate])

    const onSubmit = async (data: OTPFormData) => {
        setIsLoading(true)
        try {
            const response = await authService.verifyOTP(email, data.otp)
            toast.success('Email verified successfully!')

            // Store tokens
            localStorage.setItem('access_token', response.access)
            localStorage.setItem('refresh_token', response.refresh)

            // Force page reload to trigger AuthProvider hydration or redirect to onboarding
            // Ideally we should use a method from AuthProvider to set user state without reload
            // But reloading is a safe way to ensure everything re-syncs
            window.location.href = '/onboarding/create-school'

        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    if (!email) return null

    return (
        <div className="w-full max-w-md mx-auto py-12">
            <Card className="border-border/50 shadow-xl shadow-primary/5">
                <CardHeader className="space-y-1">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Verify your Email</CardTitle>
                    <CardDescription className="text-center">
                        We've sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="otp">Enter Verification Code</Label>
                            <Input
                                id="otp"
                                placeholder="XXXXXX"
                                className="text-center text-lg tracking-widest uppercase"
                                maxLength={6}
                                {...register('otp')}
                                error={!!errors.otp}
                            />
                            {errors.otp && <p className="text-xs text-destructive">{errors.otp.message}</p>}
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Didn't receive the code? Check your spam folder or try again in a few minutes.
                        </p>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </Button>

                        <Button variant="ghost" className="w-full" asChild>
                            <Link to="/register-admin">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Registration
                            </Link>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
