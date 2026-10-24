import { TIPOS_EVENTO } from '@/lib/eventos';
import { cn } from '@/lib/utils';
import type { TipoEvento } from '@/types';

export function EventoIcon({
    tipo,
    className,
}: {
    tipo: TipoEvento;
    className?: string;
}) {
    const { icono: Icono, negativo } = TIPOS_EVENTO[tipo];
    const positivo = tipo === 'recepcion_conforme';

    return (
        <span
            className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full border',
                negativo && 'border-crit/25 bg-crit-soft text-crit-foreground',
                positivo && 'border-ok/25 bg-ok-soft text-ok-foreground',
                !negativo &&
                    !positivo &&
                    'bg-secondary text-secondary-foreground',
                className,
            )}
            aria-hidden
        >
            <Icono className="size-4" />
        </span>
    );
}
