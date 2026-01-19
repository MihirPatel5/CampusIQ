import { useState, useEffect } from 'react'
import { Plus, Loader2, FileText, CheckCircle2, AlertCircle, Search, Filter, Receipt, Download, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { academicService } from '@/services/academicService'
import { feeService } from '@/services/feeService'
import { getErrorMessage } from '@/services/api'
import type { FeeStructure, Invoice, Payment, Class } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'

export default function FeesPage() {
    const [structures, setStructures] = useState<FeeStructure[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [classes, setClasses] = useState<Class[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Filters
    const [selectedClass, setSelectedClass] = useState<string>('')

    // Dialogs
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        payment_mode: 'cash' as any,
        transaction_reference: '',
        remarks: ''
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setIsLoading(true)
        try {
            const [structData, classData] = await Promise.all([
                feeService.getFeeStructures(),
                academicService.getClasses()
            ])
            setStructures(structData)
            setClasses(classData)

            // Also fetch some recent invoices and payments
            const [invData, payData] = await Promise.all([
                feeService.getInvoices({ limit: 10 }),
                feeService.getPayments({ limit: 10 })
            ])
            setInvoices(invData)
            setPayments(payData)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleRecordPayment = async () => {
        if (!selectedInvoice) return

        setIsSaving(true)
        try {
            await feeService.recordPayment({
                invoice: selectedInvoice.id,
                ...paymentData
            })
            toast.success('Payment recorded successfully')
            setIsPaymentDialogOpen(false)
            fetchInitialData() // Refresh lists
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200'
            case 'partial': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'pending': return 'bg-warning/10 text-warning border-warning/20'
            case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20'
            default: return ''
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fees & Payments</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage fee structures, invoices and record collections
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export Report
                    </Button>
                    <Button className="gap-2" onClick={() => toast.info('Detailed structure creation coming soon')}>
                        <Plus className="h-4 w-4" /> New Structure
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Collections (Monthly)</CardDescription>
                        <CardTitle className="text-2xl font-bold">₹ 4,25,000</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-success flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> +12% from last month
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Amount</CardDescription>
                        <CardTitle className="text-2xl font-bold text-destructive">₹ 1,12,000</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Across 45 pending invoices</div>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription>Overdue Invoices</CardDescription>
                        <CardTitle className="text-2xl font-bold">12</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Critical attention required
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary/70">Payment Success Rate</CardDescription>
                        <CardTitle className="text-2xl font-bold text-primary">94.2%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-primary/60">Target: 98%</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="invoices" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="invoices" className="gap-2">
                        <FileText className="h-4 w-4" /> Invoices
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="gap-2">
                        <Landmark className="h-4 w-4" /> Collections
                    </TabsTrigger>
                    <TabsTrigger value="structures" className="gap-2">
                        <Filter className="h-4 w-4" /> Fee Structures
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50">
                        <div className="flex gap-4 items-center">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search student or invoice..." className="w-64" />
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="w-40 h-9">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="secondary" size="sm" className="gap-2">
                            <Receipt className="h-4 w-4" /> Generate Bulk
                        </Button>
                    </div>

                    <div className="border rounded-xl bg-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Invoice #</th>
                                    <th className="px-6 py-4 font-medium">Student</th>
                                    <th className="px-6 py-4 font-medium">Structure</th>
                                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                                    <th className="px-6 py-4 font-medium text-right">Remaining</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}><td colSpan={7} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td></tr>
                                    ))
                                ) : invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium">{inv.invoice_number}</td>
                                        <td className="px-6 py-4 font-semibold">{inv.student_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{inv.fee_structure_name}</td>
                                        <td className="px-6 py-4 text-right font-medium">₹ {inv.total_amount}</td>
                                        <td className="px-6 py-4 text-right text-destructive font-semibold">₹ {inv.remaining_amount}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn("capitalize", getStatusColor(inv.status))}>
                                                {inv.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-primary"
                                                onClick={() => {
                                                    setSelectedInvoice(inv)
                                                    setPaymentData({ amount: inv.remaining_amount, payment_mode: 'cash', transaction_reference: '', remarks: '' })
                                                    setIsPaymentDialogOpen(true)
                                                }}
                                            >
                                                Record Pay
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="payments">
                    <div className="border rounded-xl bg-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Receipt #</th>
                                    <th className="px-6 py-4 font-medium">Invoice #</th>
                                    <th className="px-6 py-4 font-medium">Student</th>
                                    <th className="px-6 py-4 font-medium text-right">Collected</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Mode</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30">
                                        <td className="px-6 py-4 font-mono">{p.receipt_number}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{p.invoice_number}</td>
                                        <td className="px-6 py-4 font-medium">{p.student_name}</td>
                                        <td className="px-6 py-4 text-right text-success font-semibold">₹ {p.amount}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{p.payment_date}</td>
                                        <td className="px-6 py-4 capitalize">
                                            <Badge variant="secondary">{p.payment_mode}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="structures">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {structures.map((s) => (
                            <Card key={s.id}>
                                <CardHeader>
                                    <CardTitle>{s.name}</CardTitle>
                                    <CardDescription>{s.class_name} | {s.academic_year}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-3xl font-bold">₹ {s.total_amount}</div>
                                    <div className="space-y-1">
                                        {s.fee_items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs text-muted-foreground border-b border-border/30 pb-1">
                                                <span>{item.name}</span>
                                                <span>₹ {item.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="ghost" size="sm" className="w-full">Edit Structure</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Collect fee payment for {selectedInvoice?.invoice_number} ({selectedInvoice?.student_name})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount Collected (Remaining: ₹ {selectedInvoice?.remaining_amount})</Label>
                            <Input
                                type="number"
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <Select value={paymentData.payment_mode} onValueChange={(v) => setPaymentData({ ...paymentData, payment_mode: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="online">Online Transfer</SelectItem>
                                    <SelectItem value="upi">UPI / QR</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reference (TXN ID / Cheque #)</Label>
                            <Input
                                placeholder="Optional"
                                value={paymentData.transaction_reference}
                                onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Input
                                placeholder="Internal notes"
                                value={paymentData.remarks}
                                onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRecordPayment} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
