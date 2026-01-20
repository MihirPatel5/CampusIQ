import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { AdmissionFormConfig } from '@/types'

interface DynamicFormFieldProps {
    config: AdmissionFormConfig
    value: any
    onChange: (value: any) => void
    error?: string
}

export function DynamicFormField({ config, value, onChange, error }: DynamicFormFieldProps) {
    const { field_name, field_label, field_type, is_required, help_text, placeholder, options } = config

    const renderField = () => {
        switch (field_type) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <Input
                        id={field_name}
                        type={field_type}
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={error ? 'border-destructive' : ''}
                    />
                )

            case 'date':
                return (
                    <Input
                        id={field_name}
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={error ? 'border-destructive' : ''}
                    />
                )

            case 'decimal':
                return (
                    <Input
                        id={field_name}
                        type="number"
                        step="0.01"
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={error ? 'border-destructive' : ''}
                    />
                )

            case 'textarea':
                return (
                    <Textarea
                        id={field_name}
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                        className={error ? 'border-destructive' : ''}
                        rows={3}
                    />
                )

            case 'select':
                return (
                    <Select value={value || ''} onValueChange={onChange}>
                        <SelectTrigger className={error ? 'border-destructive' : ''}>
                            <SelectValue placeholder={placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )

            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={field_name}
                            checked={value || false}
                            onCheckedChange={onChange}
                        />
                        <label
                            htmlFor={field_name}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {field_label}
                        </label>
                    </div>
                )

            case 'file':
            case 'image':
                return (
                    <Input
                        id={field_name}
                        type="file"
                        accept={field_type === 'image' ? 'image/*' : undefined}
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) onChange(file)
                        }}
                        className={error ? 'border-destructive' : ''}
                    />
                )

            default:
                return (
                    <Input
                        id={field_name}
                        type="text"
                        placeholder={placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={error ? 'border-destructive' : ''}
                    />
                )
        }
    }

    // Don't render label for checkbox (it's handled inside the checkbox case)
    if (field_type === 'checkbox') {
        return (
            <div className="space-y-2">
                {renderField()}
                {help_text && <p className="text-xs text-muted-foreground">{help_text}</p>}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={field_name}>
                {field_label}
                {is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderField()}
            {help_text && <p className="text-xs text-muted-foreground">{help_text}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}
