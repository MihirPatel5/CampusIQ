import { useState, useEffect } from 'react'
import { Plus, Building2, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { schoolService } from '@/services/schoolService'
import { getErrorMessage } from '@/services/api'
import type { School } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const schoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Invalid pincode'),
  address: z.string().min(5, 'Address is required'),
  established_year: z.preprocess((val) => Number(val), z.number().min(1800).max(new Date().getFullYear())),
  affiliation: z.string().min(2, 'Affiliation (e.g. CBSE) is required'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  // Admin fields (optional in schema, handled in logic)
  admin_username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal('')),
  admin_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  admin_password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
})

type SchoolFormData = z.infer<typeof schoolSchema>

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      pincode: '',
      address: '',
      established_year: new Date().getFullYear(),
      affiliation: 'CBSE',
      website: '',
    }
  })

  useEffect(() => {
    if (editingSchool) {
      reset({
        name: editingSchool.name,
        email: editingSchool.email,
        phone: editingSchool.phone,
        city: editingSchool.city,
        state: editingSchool.state,
        pincode: editingSchool.pincode,
        address: editingSchool.address,
        established_year: editingSchool.established_year || new Date().getFullYear(),
        affiliation: editingSchool.affiliation,
        website: editingSchool.website || '',
      })
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        pincode: '',
        address: '',
        established_year: new Date().getFullYear(),
        affiliation: 'CBSE',
        website: '',
        admin_username: '',
        admin_email: '',
        admin_password: '',
      })
    }
  }, [editingSchool, reset])

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    setIsLoading(true)
    try {
      const data = await schoolService.getSchools()
      setSchools(data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SchoolFormData) => {
    setIsCreating(true)
    try {
      if (editingSchool) {
        await schoolService.updateSchool(editingSchool.id, data)
        toast.success('School updated successfully!')
      } else {
        await schoolService.createSchool(data)
        toast.success('School created successfully!')
      }
      setIsOpen(false)
      setEditingSchool(null)
      reset()
      fetchSchools()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await schoolService.deleteSchool(deleteConfirmId)
      toast.success('School deleted successfully')
      fetchSchools()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleEdit = (school: School) => {
    setEditingSchool(school)
    setIsOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all schools in the multi-tenant system
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) setEditingSchool(null)
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New School
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
              <DialogDescription>
                {editingSchool ? 'Update school details.' : 'Create a new school tenant in the system.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name</Label>
                  <Input id="name" placeholder="Greenwood International" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="admin@greenwood.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+91-XXXXXXXXXX" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Education Lane" {...register('address')} />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="established_year">Established Year</Label>
                  <Input id="established_year" type="number" placeholder="2010" {...register('established_year')} />
                  {errors.established_year && <p className="text-xs text-destructive">{errors.established_year.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliation">Affiliation</Label>
                  <Input id="affiliation" placeholder="CBSE" {...register('affiliation')} />
                  {errors.affiliation && <p className="text-xs text-destructive">{errors.affiliation.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="https://greenwood.edu" {...register('website')} />
                {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
              </div>

              {!editingSchool && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-primary" />
                    </div>
                    Initial Admin User
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_username">Admin Username</Label>
                      <Input id="admin_username" placeholder="schooladmin" {...register('admin_username')} />
                      {errors.admin_username && <p className="text-xs text-destructive">{errors.admin_username.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_email">Admin Email</Label>
                      <Input id="admin_email" type="email" placeholder="admin@school.com" {...register('admin_email')} />
                      {errors.admin_email && <p className="text-xs text-destructive">{errors.admin_email.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Admin Password</Label>
                    <Input id="admin_password" type="password" placeholder="••••••••" {...register('admin_password')} />
                    {errors.admin_password && <p className="text-xs text-destructive">{errors.admin_password.message}</p>}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    editingSchool ? 'Update School' : 'Create School'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-medium">School Name</th>
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Verification Code</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-foreground">{school.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{school.code}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {school.city}, {school.state}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{school.phone}</span>
                        <span className="text-xs text-muted-foreground">{school.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-[10px] bg-background">
                        {school.school_verification_code}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={school.status === 'active' ? 'outline' : 'secondary'}
                        className={school.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      >
                        {school.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(school)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirmId(school.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No schools found. Start by adding a new one.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the school tenant
              and all of its associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
