import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type FieldProps = {
    id: string;
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
};

export function FormField({
    id,
    label,
    error,
    className,
    children,
}: FieldProps) {
    return (
        <div className={cn('grid gap-1.5', className)}>
            <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
            </Label>
            {children}
            <InputError message={error} className="text-xs" />
        </div>
    );
}

export type Opcion = { value: string; label: string };

type SelectProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    opciones: Opcion[];
    placeholder?: string;
    invalid?: boolean;
};

/** Select de shadcn alimentado por una lista de opciones. */
export function FormSelect({
    id,
    value,
    onChange,
    opciones,
    placeholder = 'Elegí una opción',
    invalid,
}: SelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                id={id}
                className="w-full min-w-0 bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate"
                aria-invalid={invalid || undefined}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {opciones.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
