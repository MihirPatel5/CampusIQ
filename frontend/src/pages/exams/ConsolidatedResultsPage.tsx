import { useState, useEffect } from 'react'
import {
    Download,
    Loader2,
    Printer,
    Trophy,
    AlertCircle,
    BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { examService } from '@/services/examService'
import { getErrorMessage } from '@/services/api'
import type { Exam } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'

export default function ConsolidatedResultsPage() {
    const [exams, setExams] = useState<Exam[]>([])

    const [selectedExamId, setSelectedExamId] = useState<string>('')
    const [results, setResults] = useState<any>(null)
    const [isLoadingResults, setIsLoadingResults] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const examData = await examService.getExams()
            setExams(examData)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const fetchResults = async () => {
        if (!selectedExamId) return
        setIsLoadingResults(true)
        try {
            const data = await examService.getConsolidatedResults(parseInt(selectedExamId))
            setResults(data)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoadingResults(false)
        }
    }

    useEffect(() => {
        if (selectedExamId) fetchResults()
    }, [selectedExamId])

    const getGradeColor = (grade: string) => {
        const g = grade.toUpperCase()
        if (g.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200'
        if (g.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (g.startsWith('C')) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                        Consolidated Results
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View class-wise result sheets and performance analytics
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.print()} disabled={!results}>
                        <Printer className="h-4 w-4" /> Print Sheet
                    </Button>
                    <Button className="gap-2 rounded-xl">
                        <Download className="h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>

            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="space-y-2 flex-1">
                            <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Select Exam</Label>
                            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                <SelectTrigger className="h-12 text-lg rounded-xl">
                                    <SelectValue placeholder="Choose an Exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.title} ({e.academic_year})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {results && (
                            <div className="flex items-center gap-8 px-6 py-2 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Students</p>
                                    <p className="text-2xl font-black text-primary">{results.summary?.total_students}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Pass Rate</p>
                                    <p className="text-2xl font-black text-success">{results.summary?.pass_percentage}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Class Avg</p>
                                    <p className="text-2xl font-black text-blue-600">{results.summary?.class_average}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingResults ? (
                        <div className="p-20 text-center space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                            <p className="text-muted-foreground font-medium">Processing consolidated report...</p>
                        </div>
                    ) : results ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Roll #</th>
                                        <th className="px-6 py-4 text-left">Student Name</th>
                                        {results.subjects?.map((s: any) => (
                                            <th key={s.id} className="px-4 py-4 text-center">{s.name}</th>
                                        ))}
                                        <th className="px-6 py-4 text-center bg-primary/5">Total</th>
                                        <th className="px-6 py-4 text-center bg-primary/5">Avg %</th>
                                        <th className="px-6 py-4 text-center bg-primary/5">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {results.student_results?.map((row: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono font-medium">{row.roll_number || idx + 1}</td>
                                            <td className="px-6 py-4 font-bold">{row.student_name}</td>
                                            {results.subjects?.map((s: any) => {
                                                const score = row.scores[s.id]
                                                return (
                                                    <td key={s.id} className="px-4 py-4 text-center font-medium">
                                                        {score !== undefined ? score : '-'}
                                                    </td>
                                                )
                                            })}
                                            <td className="px-6 py-4 text-center font-black bg-primary/5">
                                                {row.total_marks} / {row.total_max_marks}
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-primary bg-primary/5">
                                                {row.percentage}%
                                            </td>
                                            <td className="px-6 py-4 text-center bg-primary/5">
                                                <Badge variant="outline" className={cn("rounded-full px-3", getGradeColor(row.grade))}>
                                                    {row.grade}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-20 text-center space-y-6">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <BarChart3 className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">No Results Selected</h3>
                                <p className="text-muted-foreground">Select an exam to view the consolidated performance sheet.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" /> Top Performers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {results.student_results
                                ?.sort((a: any, b: any) => b.percentage - a.percentage)
                                .slice(0, 3)
                                .map((student: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r from-background to-primary/5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white",
                                                idx === 0 ? "bg-yellow-400 text-yellow-900" :
                                                    idx === 1 ? "bg-slate-300 text-slate-800" :
                                                        "bg-orange-300 text-orange-900"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-bold">{student.student_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-primary font-black">{student.percentage}%</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Grade {student.grade}</p>
                                        </div>
                                    </div>
                                ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" /> Performance Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Students below 40%</span>
                                    <Badge variant="destructive" className="rounded-full">
                                        {results.student_results?.filter((s: any) => s.percentage < 40).length || 0}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Incomplete results</span>
                                    <Badge variant="secondary" className="rounded-full">
                                        {results.student_results?.filter((s: any) => s.is_incomplete).length || 0}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t">
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground py-0 h-auto underline">
                                View Detailed Analytics
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
}
