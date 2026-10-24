import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { seguirCursor } from '@/lib/spotlight';
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
        <div
            onMouseMove={seguirCursor}
            className="spotlight group rounded-xl border bg-card p-4 transition-colors hover:border-foreground/15 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="etiqueta-seccion">{label}</span>
                {Icono && (
                    <span
                        className={cn(
                            'grid size-7 place-items-center rounded-md border bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground',
                            tone === 'alerta' &&
                                'border-crit/25 bg-crit-soft text-crit-foreground group-hover:text-crit-foreground',
                        )}
                        aria-hidden
                    >
                        <Icono className="size-3.5" />
                    </span>
                )}
            </div>
            <div className="mt-3 text-[26px] leading-none font-semibold tracking-tight tabular-nums">
                {value}
            </div>
            {hint && (
                <div className="mt-1.5 truncate text-xs text-muted-foreground">
                    {hint}
                </div>
            )}
        </div>
    );
}
