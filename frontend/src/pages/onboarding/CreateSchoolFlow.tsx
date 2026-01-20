import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Loader2, Save } from 'lucide-react'
import { schoolService } from '@/services/schoolService'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const schoolSchema = z.object({
    name: z.string().min(3, 'School name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Invalid phone number'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Invalid pincode'),
    address: z.string().min(5, 'Address is required'),
    established_year: z.string().transform((val) => parseInt(val)).or(z.number()),
    affiliation: z.string().min(2, 'Affiliation is required'),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type SchoolFormData = z.infer<typeof schoolSchema>

export default function CreateSchoolFlow() {
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SchoolFormData>({
        resolver: zodResolver(schoolSchema),
        defaultValues: {
            established_year: new Date().getFullYear(),
            affiliation: 'CBSE',
        }
    })

    const onSubmit = async (data: SchoolFormData) => {
        setIsLoading(true)
        try {
            await schoolService.createMySchool(data as any)
            toast.success('School created successfully! Welcome to your dashboard.')
            // Force reload to update user context with new school
            window.location.href = '/dashboard'
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container max-w-3xl py-12">
            <div className="flex flex-col items-center mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to CampusIQ!</h1>
                <p className="text-muted-foreground text-lg">
                    Let's get your school set up. Simply provide the details below to create your institution's profile.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <CardTitle>School Information</CardTitle>
                    </div>
                    <CardDescription>
                        These details will be used for official communications and verification.
                    </CardDescription>
                </CardHeader>
                <Separator />
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">School Name</Label>
                                    <Input id="name" placeholder="Ex. Greenfield International School" {...register('name')} error={!!errors.name} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Official Email</Label>
                                    <Input id="email" type="email" placeholder="contact@greenfield.edu" {...register('email')} error={!!errors.email} />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="+91-XXXXXXXXXX" {...register('phone')} error={!!errors.phone} />
                                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Input id="address" placeholder="123 Education Lane, Knowledge Park" {...register('address')} error={!!errors.address} />
                                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="Mumbai" {...register('city')} error={!!errors.city} />
                                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" placeholder="Maharashtra" {...register('state')} error={!!errors.state} />
                                    {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input id="pincode" placeholder="400001" {...register('pincode')} error={!!errors.pincode} />
                                    {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="established_year">Established Year</Label>
                                    <Input id="established_year" type="number" placeholder="1995" {...register('established_year')} error={!!errors.established_year} />
                                    {errors.established_year && <p className="text-xs text-destructive">{errors.established_year.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="affiliation">Affiliation</Label>
                                    <Input id="affiliation" placeholder="CBSE / ICSE / State Board" {...register('affiliation')} error={!!errors.affiliation} />
                                    {errors.affiliation && <p className="text-xs text-destructive">{errors.affiliation.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website (Optional)</Label>
                                    <Input id="website" placeholder="https://www.school.edu" {...register('website')} error={!!errors.website} />
                                    {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-muted/20 p-6">
                        <Button type="submit" size="lg" disabled={isLoading} className="min-w-[150px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create School
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
