import type { LucideIcon } from 'lucide-react';
import { CircleAlert, CircleCheck, OctagonAlert } from 'lucide-react';
import type { NivelSemaforo } from '@/types';

type EstiloSemaforo = {
    icono: LucideIcon;
    /** Texto y borde sobre fondo suave (badges, alertas). */
    suave: string;
    /** Color sólido para barras y anillos. */
    solido: string;
    texto: string;
    trazo: string;
};

/** El estado nunca se comunica solo con color: siempre va con ícono y etiqueta. */
export const SEMAFORO: Record<NivelSemaforo, EstiloSemaforo> = {
    verde: {
        icono: CircleCheck,
        suave: 'bg-ok-soft text-ok-foreground border-ok/25',
        solido: 'bg-ok',
        texto: 'text-ok-foreground',
        trazo: 'stroke-ok',
    },
    amarillo: {
        icono: CircleAlert,
        suave: 'bg-warn-soft text-warn-foreground border-warn/30',
        solido: 'bg-warn',
        texto: 'text-warn-foreground',
        trazo: 'stroke-warn',
    },
    rojo: {
        icono: OctagonAlert,
        suave: 'bg-crit-soft text-crit-foreground border-crit/25',
        solido: 'bg-crit',
        texto: 'text-crit-foreground',
        trazo: 'stroke-crit',
    },
};

/** Mismos cortes que ScoringService (≥75 verde, 50-74 amarillo, <50 rojo). */
export function nivelPorPuntaje(puntaje: number): NivelSemaforo {
    if (puntaje >= 75) {
        return 'verde';
    }

    return puntaje >= 50 ? 'amarillo' : 'rojo';
}
