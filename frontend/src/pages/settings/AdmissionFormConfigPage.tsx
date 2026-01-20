import { useState, useEffect } from 'react'
import { Settings, Eye, EyeOff, CheckSquare, Square, Loader2, RotateCcw, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { studentService } from '@/services/studentService'
import { getErrorMessage } from '@/services/api'
import type { GroupedFormConfig, AdmissionFormConfig } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SECTION_LABELS: Record<string, string> = {
    'basic': 'Basic Information',
    'personal': 'Personal Information',
    'contact': 'Contact Information',
    'emergency': 'Emergency Contact',
    'medical': 'Medical Information',
    'academic': 'Academic Information',
    'documents': 'Documents',
    'transport': 'Transport',
    'hostel': 'Hostel',
    'parent': 'Parent Information',
}

export default function AdmissionFormConfigPage() {
    const [formConfig, setFormConfig] = useState<GroupedFormConfig>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [activeSection, setActiveSection] = useState('basic')

    useEffect(() => {
        fetchFormConfig()
    }, [])

    const fetchFormConfig = async () => {
        setIsLoading(true)
        try {
            const data = await studentService.getFormConfigBySection()
            setFormConfig(data)

        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleVisibility = async (config: AdmissionFormConfig) => {
        try {
            const updated = await studentService.updateFormConfig(config.id, {
                is_visible: !config.is_visible
            })

            // Update local state
            setFormConfig(prev => {
                const section = Object.keys(prev).find(key =>
                    prev[key].some(c => c.id === config.id)
                )
                if (!section) return prev

                return {
                    ...prev,
                    [section]: prev[section].map(c =>
                        c.id === config.id ? { ...c, is_visible: !c.is_visible } : c
                    )
                }
            })

            toast.success(`${config.field_label} ${updated.is_visible ? 'shown' : 'hidden'}`)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const handleToggleRequired = async (config: AdmissionFormConfig) => {
        try {
            const updated = await studentService.updateFormConfig(config.id, {
                is_required: !config.is_required
            })

            // Update local state
            setFormConfig(prev => {
                const section = Object.keys(prev).find(key =>
                    prev[key].some(c => c.id === config.id)
                )
                if (!section) return prev

                return {
                    ...prev,
                    [section]: prev[section].map(c =>
                        c.id === config.id ? { ...c, is_required: !c.is_required } : c
                    )
                }
            })

            toast.success(`${config.field_label} ${updated.is_required ? 'required' : 'optional'}`)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const handleResetToDefaults = async () => {
        setIsSaving(true)
        try {
            await studentService.resetFormConfigToDefaults()
            toast.success('Form configuration reset to defaults')
            fetchFormConfig()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const getFieldTypeIcon = (type: string) => {
        switch (type) {
            case 'text':
            case 'email':
                return '📝'
            case 'number':
            case 'decimal':
                return '🔢'
            case 'date':
                return '📅'
            case 'select':
                return '📋'
            case 'textarea':
                return '📄'
            case 'file':
            case 'image':
                return '📎'
            case 'checkbox':
                return '☑️'
            default:
                return '📝'
        }
    }

    const getVisibleCount = (section: string) => {
        return formConfig[section]?.filter(c => c.is_visible).length || 0
    }

    const getRequiredCount = (section: string) => {
        return formConfig[section]?.filter(c => c.is_required && c.is_visible).length || 0
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        Admission Form Configuration
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Customize which fields are visible and required in your student admission form
                    </p>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Reset to Defaults
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Reset to Default Configuration?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will reset all form field settings to the default configuration. Any customizations you've made will be lost.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetToDefaults} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reset
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-32 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
                    <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2">
                        {Object.keys(formConfig).map((section) => (
                            <TabsTrigger key={section} value={section} className="text-xs">
                                {SECTION_LABELS[section] || section}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {Object.entries(formConfig).map(([section, fields]) => (
                        <TabsContent key={section} value={section} className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{SECTION_LABELS[section] || section}</span>
                                        <div className="flex gap-4 text-sm font-normal">
                                            <Badge variant="secondary">
                                                <Eye className="h-3 w-3 mr-1" />
                                                {getVisibleCount(section)} visible
                                            </Badge>
                                            <Badge variant="default">
                                                <CheckSquare className="h-3 w-3 mr-1" />
                                                {getRequiredCount(section)} required
                                            </Badge>
                                        </div>
                                    </CardTitle>
                                    <CardDescription>
                                        Configure which fields are shown and required in the {SECTION_LABELS[section]?.toLowerCase()} section
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {fields.map((config) => (
                                            <div
                                                key={config.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{getFieldTypeIcon(config.field_type)}</span>
                                                            <span className="font-medium">{config.field_label}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {config.field_type}
                                                            </Badge>
                                                        </div>
                                                        {config.help_text && (
                                                            <p className="text-sm text-muted-foreground mt-1">{config.help_text}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id={`visible-${config.id}`}
                                                            checked={config.is_visible}
                                                            onCheckedChange={() => handleToggleVisibility(config)}
                                                        />
                                                        <Label htmlFor={`visible-${config.id}`} className="text-sm cursor-pointer">
                                                            {config.is_visible ? (
                                                                <span className="flex items-center gap-1 text-green-600">
                                                                    <Eye className="h-4 w-4" /> Visible
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                                    <EyeOff className="h-4 w-4" /> Hidden
                                                                </span>
                                                            )}
                                                        </Label>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id={`required-${config.id}`}
                                                            checked={config.is_required}
                                                            onCheckedChange={() => handleToggleRequired(config)}
                                                            disabled={!config.is_visible}
                                                        />
                                                        <Label htmlFor={`required-${config.id}`} className="text-sm cursor-pointer">
                                                            {config.is_required ? (
                                                                <span className="flex items-center gap-1 text-orange-600">
                                                                    <CheckSquare className="h-4 w-4" /> Required
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                                    <Square className="h-4 w-4" /> Optional
                                                                </span>
                                                            )}
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    )
}
