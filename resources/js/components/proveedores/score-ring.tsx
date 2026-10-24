import { SEMAFORO } from '@/lib/semaforo';
import { cn } from '@/lib/utils';
import type { NivelSemaforo } from '@/types';

type Props = {
    puntaje: number;
    nivel: NivelSemaforo;
    size?: 'sm' | 'lg';
    className?: string;
};

const RADIO = 42;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/** Anillo de puntaje 0-100 en SVG puro. */
export function ScoreRing({ puntaje, nivel, size = 'lg', className }: Props) {
    const avance = Math.min(100, Math.max(0, puntaje)) / 100;

    return (
        <div
            role="img"
            aria-label={`Puntaje ${puntaje} de 100`}
            className={cn(
                'relative grid shrink-0 place-items-center',
                size === 'lg' ? 'size-32' : 'size-12',
                className,
            )}
        >
            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 -rotate-90"
                aria-hidden
            >
                <circle
                    cx="50"
                    cy="50"
                    r={RADIO}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-muted"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={RADIO}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUNFERENCIA}
                    strokeDashoffset={CIRCUNFERENCIA * (1 - avance)}
                    className={cn(
                        SEMAFORO[nivel].trazo,
                        'transition-[stroke-dashoffset] duration-700 ease-out',
                    )}
                />
            </svg>
            <div className="text-center leading-none">
                <span
                    className={cn(
                        'font-semibold tabular-nums',
                        size === 'lg' ? 'text-4xl' : 'text-sm',
                    )}
                >
                    {puntaje}
                </span>
                {size === 'lg' && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                        de 100
                    </span>
                )}
            </div>
        </div>
    );
}
