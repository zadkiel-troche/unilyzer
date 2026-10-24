import { Badge } from '@/components/ui/badge';
import { SEMAFORO } from '@/lib/semaforo';
import { cn } from '@/lib/utils';
import type { Semaforo } from '@/types';

export function SemaforoBadge({
    semaforo,
    className,
}: {
    semaforo: Semaforo;
    className?: string;
}) {
    const { icono: Icono, suave } = SEMAFORO[semaforo.nivel];

    return (
        <Badge variant="outline" className={cn(suave, className)}>
            <Icono aria-hidden />
            {semaforo.etiqueta}
        </Badge>
    );
}
