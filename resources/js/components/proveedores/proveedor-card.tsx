import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { EventoIcon } from '@/components/proveedores/evento-icon';
import { ScoreRing } from '@/components/proveedores/score-ring';
import { SemaforoBadge } from '@/components/proveedores/semaforo-badge';
import { etiquetaRubro, TIPOS_EVENTO } from '@/lib/eventos';
import { formatFecha } from '@/lib/format';
import { show } from '@/routes/proveedores';
import type { ResultadoBusqueda } from '@/types';

const MAX_EVENTOS = 3;

export function ProveedorCard({ resultado }: { resultado: ResultadoBusqueda }) {
    const {
        id,
        nombre,
        rubro,
        puntaje,
        semaforo,
        motivo,
        eventos_coincidentes: eventos,
    } = resultado;
    const ocultos = eventos.length - MAX_EVENTOS;

    return (
        <li>
            <Link
                href={show(id)}
                prefetch
                className="group flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-brand-action/50 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:p-5"
            >
                <ScoreRing puntaje={puntaje} nivel={semaforo.nivel} size="sm" />
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-semibold group-hover:text-primary">
                            {nombre}
                        </h3>
                        <SemaforoBadge semaforo={semaforo} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {etiquetaRubro(rubro)}
                    </p>
                    <p className="text-sm text-pretty">{motivo}</p>

                    {eventos.length > 0 && (
                        <ul
                            className="space-y-1.5 border-t pt-2"
                            aria-label="Eventos que coinciden con la búsqueda"
                        >
                            {eventos.slice(0, MAX_EVENTOS).map((e) => (
                                <li
                                    key={e.id}
                                    className="flex items-start gap-2 text-xs"
                                >
                                    <EventoIcon
                                        tipo={e.tipo}
                                        className="size-5 [&_svg]:size-3"
                                    />
                                    <span className="min-w-0">
                                        <span className="font-medium">
                                            {TIPOS_EVENTO[e.tipo].etiqueta}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · {formatFecha(e.fecha)} ·{' '}
                                        </span>
                                        {e.descripcion}
                                    </span>
                                </li>
                            ))}
                            {ocultos > 0 && (
                                <li className="text-xs text-muted-foreground">
                                    y {ocultos} eventos más
                                </li>
                            )}
                        </ul>
                    )}
                </div>
                <ChevronRight
                    className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                />
            </Link>
        </li>
    );
}
