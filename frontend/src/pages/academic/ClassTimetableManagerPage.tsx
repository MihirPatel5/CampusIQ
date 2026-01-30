import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { toast } from 'sonner'
import { academicService } from '@/services/academicService'
import { timetableService } from '@/services/timetableService'
import { TimetableGrid } from '@/components/academic/TimetableGrid'
import type { Class, Section, Period, TimetableEntry, SubjectAssignment } from '@/types'

export default function ClassTimetableManagerPage() {
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [periods, setPeriods] = useState<Period[]>([])
    const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
    const [assignments, setAssignments] = useState<SubjectAssignment[]>([])
    const [rooms, setRooms] = useState<any[]>([])

    // Selection State
    const [selectedClassId, setSelectedClassId] = useState<string>('')
    const [selectedSectionId, setSelectedSectionId] = useState<string>('')

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ day: number, period: Period } | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | undefined>(undefined)
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('')
    const [selectedRoomId, setSelectedRoomId] = useState<string>('')

    // Load initial data (Classes and Periods)
    useEffect(() => {
        fetchInitialData()
    }, [])

    // Load sections when class changes
    useEffect(() => {
        if (selectedClassId) {
            fetchSections(parseInt(selectedClassId))
        } else {
            setSections([])
            setSelectedSectionId('')
        }
    }, [selectedClassId])

    // Load timetable and assignments when section changes
    useEffect(() => {
        if (selectedClassId && selectedSectionId) {
            fetchTimetableData(parseInt(selectedClassId), parseInt(selectedSectionId))
        }
    }, [selectedSectionId])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [classesData, periodsData, roomsData] = await Promise.all([
                academicService.getClasses(),
                timetableService.getPeriods(),
                academicService.getClassRooms()
            ])
            setClasses(classesData)
            setPeriods(periodsData)
            setRooms(roomsData)
        } catch (error) {
            toast.error('Failed to load initial data')
        } finally {
            setLoading(false)
        }
    }

    const fetchSections = async (classId: number) => {
        try {
            const data = await academicService.getSections(classId)
            setSections(data)
        } catch (error) {
            toast.error('Failed to load sections')
        }
    }

    const fetchTimetableData = async (classId: number, sectionId: number) => {
        try {
            setLoading(true)
            const [entriesData, assignmentsData] = await Promise.all([
                timetableService.getTimetable({ class_id: classId, section_id: sectionId }),
                academicService.getSubjectAssignments({ class_id: classId, section_id: sectionId })
            ])

            setTimetableEntries(entriesData)
            setAssignments(assignmentsData)
        } catch (error) {
            toast.error('Failed to load timetable')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCellClick = (day: number, period: Period, entry?: TimetableEntry) => {
        if (!selectedSectionId) {
            toast.error('Please select a class and section first')
            return
        }

        // Don't allow assignment on breaks
        if (period.is_break) return

        setSelectedSlot({ day, period })
        setSelectedEntry(entry)

        // Pre-select assignment if editing
        if (entry) {
            // Find assignment that matches subject
            const assignment = assignments.find(a => a.subject === entry.subject)
            if (assignment) setSelectedAssignmentId(assignment.id.toString())
            if (entry.room) setSelectedRoomId(entry.room.toString())
            else setSelectedRoomId('')
        } else {
            setSelectedAssignmentId('')
            setSelectedRoomId('')
        }

        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedSlot || !selectedClassId || !selectedSectionId || !selectedAssignmentId) return

        try {
            const assignment = assignments.find(a => a.id === parseInt(selectedAssignmentId))
            if (!assignment) return

            const payload = {
                class_obj: parseInt(selectedClassId),
                section: parseInt(selectedSectionId),
                day_of_week: selectedSlot.day,
                period: selectedSlot.period.id,
                subject: assignment.subject,
                teacher: assignment.teacher,
                room: selectedRoomId ? parseInt(selectedRoomId) : null,
                academic_year: '2024-25' // TODO: Get from class or context
            }

            if (selectedEntry) {
                await timetableService.updateEntry(selectedEntry.id, payload)
                toast.success('Updated successfully')
            } else {
                await timetableService.createEntry(payload)
                toast.success('Assigned successfully')
            }

            setIsDialogOpen(false)
            fetchTimetableData(parseInt(selectedClassId), parseInt(selectedSectionId))
        } catch (error: any) {
            const msg = error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || 'Failed to save'
            toast.error(msg)
        }
    }

    const handleDelete = async () => {
        if (!selectedEntry) return
        if (!confirm("Remove this class from the schedule?")) return

        try {
            await timetableService.deleteEntry(selectedEntry.id)
            toast.success('Removed successfully')
            setIsDialogOpen(false)
            fetchTimetableData(parseInt(selectedClassId), parseInt(selectedSectionId)) // Refresh
        } catch (error) {
            toast.error('Failed to remove')
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Class Timetable</h1>
                <p className="text-muted-foreground">Manage weekly schedules for classes.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Class</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-[200px]">
                        <Label>Class</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-[200px]">
                        <Label>Section</Label>
                        <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedSectionId && (
                <>
                    <TimetableGrid
                        periods={periods}
                        entries={timetableEntries}
                        loading={loading}
                        onCellClick={handleCellClick}
                    />

                    <div className="bg-muted/30 p-4 rounded-md text-sm text-muted-foreground">
                        <h4 className="font-semibold mb-2">Instructions:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Click on any empty cell to assign a subject.</li>
                            <li>Click on an existing class to Edit or Remove it.</li>
                            <li>Teacher conflicts will be automatically detected and blocked.</li>
                        </ul>
                    </div>
                </>
            )}

            {/* Assignment Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEntry ? 'Edit Class' : 'Assign Class'} - {selectedSlot?.period.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject & Teacher</Label>
                            <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignments.length > 0 ? (
                                        assignments.map(a => (
                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                {a.subject_name} ({a.teacher_name})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No subjects assigned to this section yet.
                                            <br />
                                            Go to "Subjects" page to assign subjects.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Showing subjects assigned to this section.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Classroom / Lab (Optional)</Label>
                            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Room" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Room Assigned</SelectItem>
                                    {rooms.map(r => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.location})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 justify-end mt-4">
                            {selectedEntry && (
                                <Button variant="destructive" type="button" onClick={handleDelete} className="mr-auto">
                                    Remove
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!selectedAssignmentId}>Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
