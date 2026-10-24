import { Lightbulb } from 'lucide-react';
import { OrigenBadge } from '@/components/origen-badge';
import { Badge } from '@/components/ui/badge';
import { describirFiltros } from '@/lib/busqueda';
import type { BusquedaRespuesta } from '@/types';

/** "Así entendí tu pregunta": muestra la interpretación y los filtros aplicados. */
export function InterpretacionBox({
    respuesta,
}: {
    respuesta: BusquedaRespuesta;
}) {
    const filtros = describirFiltros(respuesta.filtros);

    return (
        <section
            aria-labelledby="interpretacion-titulo"
            className="rounded-xl border bg-card p-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2
                    id="interpretacion-titulo"
                    className="flex items-center gap-2 text-sm font-semibold"
                >
                    <Lightbulb className="size-4 text-ai" aria-hidden />
                    Así entendí tu pregunta
                </h2>
                {respuesta.modo === 'ia' && <OrigenBadge origen="ia" />}
            </div>
            <p className="mt-2 text-sm text-pretty">
                {respuesta.interpretacion}
            </p>
            {filtros.length > 0 && (
                <ul
                    className="mt-3 flex flex-wrap gap-1.5"
                    aria-label="Filtros aplicados"
                >
                    {filtros.map((f) => (
                        <li key={f}>
                            <Badge variant="outline">{f}</Badge>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
