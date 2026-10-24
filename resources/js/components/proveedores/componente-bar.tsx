import { nivelPorPuntaje, SEMAFORO } from '@/lib/semaforo';
import { cn } from '@/lib/utils';
import type { ComponenteScore } from '@/types';

type Props = {
    etiqueta: string;
    peso: number;
    componente: ComponenteScore;
};

export function ComponenteBar({ etiqueta, peso, componente }: Props) {
    const { puntaje, motivo } = componente;

    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">
                    {etiqueta}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                        · {peso}%
                    </span>
                </span>
                <span className="font-semibold tabular-nums">{puntaje}</span>
            </div>
            <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-label={etiqueta}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={puntaje}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-700',
                        SEMAFORO[nivelPorPuntaje(puntaje)].solido,
                    )}
                    style={{ width: `${puntaje}%` }}
                />
            </div>
            <p className="text-xs text-pretty text-muted-foreground">
                {motivo}
            </p>
        </div>
    );
}
