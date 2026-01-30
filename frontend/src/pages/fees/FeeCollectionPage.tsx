import { useState } from 'react'
import {
    Search,
    User,
    Users,
    CreditCard,
    Loader2,
    CheckCircle2,
    ArrowRight,
    Wallet,
    Pencil
} from 'lucide-react'
import { toast } from 'sonner'
import { feeService } from '@/services/feeService'
import { studentService } from '@/services/studentService'
import { getErrorMessage } from '@/services/api'
import type { Invoice } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function FeeCollectionPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState<'student' | 'parent'>('student')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const [selectedProfile, setSelectedProfile] = useState<any | null>(null)
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([])
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [paymentData, setPaymentData] = useState({
        payment_mode: 'cash',
        transaction_reference: '',
        remarks: ''
    })

    const handleSearch = async () => {
        if (!searchTerm) return
        setIsSearching(true)
        setSelectedProfile(null)
        setPendingInvoices([])
        try {
            if (searchType === 'student') {
                const results = await studentService.getStudents({ search: searchTerm })
                setSearchResults(results)
            } else {
                // For now, search students and extract parents, 
                // but ideally we search ParentProfile directly if we had a service for it.
                const results = await studentService.getStudents({ search: searchTerm })
                // Extract unique parents from students
                const parentsMap = new Map()
                results.forEach((s: any) => {
                    s.parents?.forEach((p: any) => {
                        parentsMap.set(p.id, { ...p, children: [...(parentsMap.get(p.id)?.children || []), s] })
                    })
                })
                setSearchResults(Array.from(parentsMap.values()))
            }
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSearching(false)
        }
    }

    const selectProfile = async (profile: any) => {
        setSelectedProfile(profile)
        setSearchResults([])
        setSearchTerm('')
        setIsLoadingInvoices(true)
        setSelectedInvoiceIds([])
        try {
            if (searchType === 'student') {
                // Fetch invoices for this student
                const invoices = await feeService.getInvoices({
                    student_id: profile.id,
                    status__in: 'pending,partial'
                })
                setPendingInvoices(invoices)
            } else {
                // Fetch family-wise invoices
                const invoices = await feeService.getFamilyPendingInvoices(profile.id)
                setPendingInvoices(invoices)
            }
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoadingInvoices(false)
        }
    }

    const toggleInvoiceSelection = (id: number) => {
        setSelectedInvoiceIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const totalToPay = pendingInvoices
        .filter(inv => selectedInvoiceIds.includes(inv.id))
        .reduce((sum, inv) => sum + parseFloat(inv.remaining_amount.toString()), 0)

    const handleBulkPayment = async () => {
        if (selectedInvoiceIds.length === 0) return
        setIsSaving(true)
        try {
            const payments = pendingInvoices
                .filter(inv => selectedInvoiceIds.includes(inv.id))
                .map(inv => ({
                    invoice: inv.id,
                    amount: parseFloat(inv.remaining_amount.toString()),
                    payment_mode: paymentData.payment_mode,
                    transaction_reference: paymentData.transaction_reference,
                    remarks: paymentData.remarks
                }))

            await feeService.bulkRecordPayment({ payments })
            toast.success(`Successfully recorded ${payments.length} payments`)
            setIsPaymentDialogOpen(false)
            // Refresh invoices
            selectProfile(selectedProfile)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                        Fee Collection
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Search student or parent to record fee payments
                    </p>
                </div>

                <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50 shadow-inner">
                    <Button
                        variant={searchType === 'student' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSearchType('student')}
                        className="rounded-lg h-9"
                    >
                        <User className="h-4 w-4 mr-2" /> Student
                    </Button>
                    <Button
                        variant={searchType === 'parent' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSearchType('parent')}
                        className="rounded-lg h-9"
                    >
                        <Users className="h-4 w-4 mr-2" /> Parent / Family
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    placeholder={`Search ${searchType}... (Name, ${searchType === 'student' ? 'Admission No' : 'Phone'})`}
                    className="pl-12 h-14 text-lg rounded-2xl border-2 border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-lg bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                    className="absolute right-2 top-2 bottom-2 rounded-xl px-6 gap-2"
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Search
                </Button>

                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[400px] overflow-y-auto backdrop-blur-sm bg-card/95">
                        {searchResults.map((res: any) => (
                            <button
                                key={res.id}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition-colors text-left border-b last:border-0 group"
                                onClick={() => selectProfile(res)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                                        {res.first_name?.[0] || 'S'}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{res.first_name} {res.last_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {searchType === 'student'
                                                ? `${res.class_name} - ${res.section_name} (${res.admission_number})`
                                                : `Parent of ${res.children?.length} children`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedProfile && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Profile Summary Card */}
                    <Card className="lg:col-span-1 border-primary/20 bg-gradient-to-br from-card to-primary/5 h-fit shadow-xl border-t-4 border-t-primary">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center text-3xl text-primary font-bold shadow-lg mb-4">
                                {selectedProfile.first_name?.[0]}
                            </div>
                            <CardTitle className="text-2xl">{selectedProfile.first_name} {selectedProfile.last_name}</CardTitle>
                            <CardDescription>
                                {searchType === 'student' ? 'Student Profile' : 'Parent Profile'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">ID/Admission No</span>
                                <span className="font-mono font-semibold">{selectedProfile.admission_number || selectedProfile.id}</span>
                            </div>
                            {searchType === 'student' ? (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Class & Section</span>
                                        <Badge variant="outline" className="font-bold">{selectedProfile.class_name} - {selectedProfile.section_name}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Guardian</span>
                                        <span className="font-medium">{selectedProfile.parents?.[0]?.first_name}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Linked Students</p>
                                    {selectedProfile.children?.map((c: any) => (
                                        <div key={c.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg border text-sm">
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{c.first_name[0]}</div>
                                            <span>{c.first_name} ({c.class_name})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Phone</span>
                                <span className="font-medium">{selectedProfile.phone || 'N/A'}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/5">
                                <Pencil className="h-4 w-4" /> Edit Profile
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Invoices List */}
                    <Card className="lg:col-span-2 shadow-xl border-border/50 overflow-hidden relative">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                            <div>
                                <CardTitle className="text-xl">Pending Invoices</CardTitle>
                                <CardDescription>Select items to pay</CardDescription>
                            </div>
                            {selectedInvoiceIds.length > 0 && (
                                <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-3 animate-in zoom-in duration-300">
                                    <span className="text-sm font-bold text-primary">₹ {totalToPay.toLocaleString()}</span>
                                    <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>Pay Now</Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingInvoices ? (
                                <div className="p-12 text-center space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="text-muted-foreground">Loading associated invoices...</p>
                                </div>
                            ) : pendingInvoices.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold">
                                                    <Checkbox
                                                        checked={selectedInvoiceIds.length === pendingInvoices.length}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedInvoiceIds(pendingInvoices.map(i => i.id))
                                                            else setSelectedInvoiceIds([])
                                                        }}
                                                    />
                                                </th>
                                                <th className="px-6 py-4 text-left font-semibold">Invoice Details</th>
                                                {searchType === 'parent' && <th className="px-6 py-4 text-left font-semibold">Student</th>}
                                                <th className="px-6 py-4 text-right font-semibold">Pending</th>
                                                <th className="px-6 py-4 text-center font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {pendingInvoices.map((inv) => (
                                                <tr key={inv.id} className={cn("hover:bg-muted/30 transition-colors", selectedInvoiceIds.includes(inv.id) && "bg-primary/5")}>
                                                    <td className="px-6 py-4">
                                                        <Checkbox
                                                            checked={selectedInvoiceIds.includes(inv.id)}
                                                            onCheckedChange={() => toggleInvoiceSelection(inv.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-bold underline cursor-help" title={inv.fee_items?.map((i: any) => `${i.name}: ₹${i.amount}`).join('\n')}>
                                                                {inv.invoice_number}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{inv.fee_structure_name}</p>
                                                        </div>
                                                    </td>
                                                    {searchType === 'parent' && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{inv.student_name}</span>
                                                                <span className="text-[10px] font-medium opacity-60">Class {inv.class_name}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-destructive font-bold">₹ {inv.remaining_amount}</span>
                                                        <p className="text-[10px] text-muted-foreground line-through">Total ₹ {inv.total_amount}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="outline" className={cn("capitalize rounded-full",
                                                            inv.status === 'partial' ? 'bg-blue-100/50 text-blue-700' : 'bg-orange-100/50 text-orange-700'
                                                        )}>
                                                            {inv.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="h-8 w-8 text-success" />
                                    </div>
                                    <h3 className="text-xl font-semibold">No Pending Dues!</h3>
                                    <p className="text-muted-foreground">All invoices for this profile have been fully cleared.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[500px] border-primary/20 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Wallet className="h-6 w-6 text-primary" /> Record Payment
                        </DialogTitle>
                        <DialogDescription>
                            Confirming collection of ₹ {totalToPay.toLocaleString()} for {selectedInvoiceIds.length} invoice(s).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Invoices</span>
                                <span className="font-bold">{selectedInvoiceIds.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Payable Amount</span>
                                <span className="text-3xl font-black text-primary">₹ {totalToPay.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Payment Method</Label>
                                <Select value={paymentData.payment_mode} onValueChange={(v) => setPaymentData({ ...paymentData, payment_mode: v })}>
                                    <SelectTrigger className="h-12 text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" /> Cash Payment
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="online">Bank Transfer</SelectItem>
                                        <SelectItem value="upi">UPI / Scanner</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Transaction Reference / Cheque #</Label>
                                <Input
                                    placeholder="Enter reference number (optional)"
                                    value={paymentData.transaction_reference}
                                    onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Internal Remarks</Label>
                                <Input
                                    placeholder="Add any notes here..."
                                    value={paymentData.remarks}
                                    onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold">Cancel</Button>
                        <Button
                            onClick={handleBulkPayment}
                            disabled={isSaving}
                            className="h-12 px-8 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                            Confirm & Record
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
