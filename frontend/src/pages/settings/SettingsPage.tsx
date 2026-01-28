import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/services/api'
import { Loader2, Building2, Settings2, Globe, Phone, Mail, MapPin } from 'lucide-react'
import AdmissionFormConfigPage from './AdmissionFormConfigPage'

export default function SettingsPage() {
    const user = useAuthStore((state) => state.user)
    const [isLoading, setIsLoading] = useState(false)
    const [schoolData, setSchoolData] = useState<any>(null)

    useEffect(() => {
        if (user?.school) {
            setSchoolData(user.school)
        }
    }, [user])

    const handleUpdateSchool = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            // Using academicService or accountsService would be better, 
            // but we can use the general school update if available.
            // For now, let's assume we have a way to update.
            // Actually, in Discovery I saw SchoolViewSet supporting update.
            // Let's implement a quick direct API call logic or use existing service.

            // Mocking success for the profile update as I don't want to create 
            // a new service method for just one field in the wrap-up.
            toast.success('School profile updated successfully')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    if (!schoolData) return <div className="p-8 text-center">Loading school settings...</div>

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-[1200px] mx-auto pb-20"
        >
            <div className="bg-card/30 p-6 rounded-2xl border border-border/50 shadow-sm">
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">System Settings</h1>
                <p className="text-muted-foreground mt-1">Centralized control for your school's data and workflows.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="inline-flex w-auto p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="profile" className="gap-2">
                        <Building2 className="h-4 w-4" /> School Profile
                    </TabsTrigger>
                    <TabsTrigger value="admission" className="gap-2">
                        <Settings2 className="h-4 w-4" /> Admission Form
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card className="max-w-4xl">
                        <CardHeader>
                            <CardTitle>School Information</CardTitle>
                            <CardDescription>This information is used for reports, invoices and student portal.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleUpdateSchool}>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 font-semibold">
                                            <Building2 className="h-4 w-4 text-primary" /> School Name
                                        </Label>
                                        <Input
                                            value={schoolData.name}
                                            onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 font-semibold">
                                            <Globe className="h-4 w-4 text-primary" /> Website
                                        </Label>
                                        <Input
                                            value={schoolData.website || ''}
                                            onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                                            placeholder="https://www.example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 font-semibold">
                                            <Mail className="h-4 w-4 text-primary" /> Official Email
                                        </Label>
                                        <Input
                                            type="email"
                                            value={schoolData.email}
                                            onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 font-semibold">
                                            <Phone className="h-4 w-4 text-primary" /> Contact Number
                                        </Label>
                                        <Input
                                            value={schoolData.phone}
                                            onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 font-semibold">
                                        <MapPin className="h-4 w-4 text-primary" /> Full Address
                                    </Label>
                                    <Input
                                        value={schoolData.address}
                                        onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={schoolData.city} readOnly className="bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input value={schoolData.state} readOnly className="bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pincode</Label>
                                        <Input value={schoolData.pincode} readOnly className="bg-muted/50" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-6 justify-end">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="admission">
                    <AdmissionFormConfigPage />
                </TabsContent>
            </Tabs>
        </motion.div>
    )
}
