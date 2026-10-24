import { Repeat } from 'lucide-react';
import { EventoCita } from '@/components/proveedores/evento-cita';
import { etiquetaCategoria, TIPOS_EVENTO } from '@/lib/eventos';
import type { Reincidencia } from '@/types';

export function ReincidenciaAlert({
    reincidencias,
}: {
    reincidencias: Reincidencia[];
}) {
    if (reincidencias.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="reincidencias-titulo"
            className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-warn-foreground"
        >
            <h2
                id="reincidencias-titulo"
                className="flex items-center gap-2 text-sm font-semibold"
            >
                <Repeat className="size-4" aria-hidden />
                {reincidencias.length === 1
                    ? 'Se detectó un patrón que se repite'
                    : `Se detectaron ${reincidencias.length} patrones que se repiten`}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
                {reincidencias.map((r) => (
                    <li
                        key={`${r.tipo}-${r.categoria}`}
                        className="flex flex-wrap items-center gap-x-2 gap-y-1"
                    >
                        <span className="font-medium">
                            {TIPOS_EVENTO[r.tipo].etiqueta} ·{' '}
                            {etiquetaCategoria(r.categoria)}
                        </span>
                        <span className="text-warn-foreground/90">
                            {r.veces} veces en {r.contratos} contratos distintos
                        </span>
                        <span className="flex flex-wrap">
                            {r.eventos.map((id) => (
                                <EventoCita key={id} id={id} />
                            ))}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
