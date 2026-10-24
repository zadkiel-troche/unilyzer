import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: LucideIcon;
    tone?: 'default' | 'alerta';
};

export function MetricTile({
    label,
    value,
    hint,
    icon: Icono,
    tone = 'default',
}: Props) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span>{label}</span>
                {Icono && (
                    <Icono
                        className={cn(
                            'size-4',
                            tone === 'alerta' && 'text-crit',
                        )}
                        aria-hidden
                    />
                )}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {value}
            </div>
            {hint && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                    {hint}
                </div>
            )}
        </div>
    );
}
