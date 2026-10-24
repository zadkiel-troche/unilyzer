import { ChevronDown, FileText, Quote } from 'lucide-react';
import { EventoIcon } from '@/components/proveedores/evento-icon';
import { OrigenBadge } from '@/components/origen-badge';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { etiquetaCategoria, TIPOS_EVENTO } from '@/lib/eventos';
import { anclaEvento } from '@/lib/evento-ancla';
import { formatDias, formatFecha, formatMonto } from '@/lib/format';
import type { EventoTimeline } from '@/types';

function TimelineItem({ evento }: { evento: EventoTimeline }) {
    const { etiqueta } = TIPOS_EVENTO[evento.tipo];
    const categoria = etiquetaCategoria(evento.categoria);

    return (
        <li className="relative flex gap-4 pb-6 last:pb-0">
            <span
                className="absolute top-9 bottom-0 left-4 w-px bg-border"
                aria-hidden
            />
            <EventoIcon tipo={evento.tipo} className="relative" />
            <article
                id={anclaEvento(evento.id)}
                tabIndex={-1}
                className="-m-2 min-w-0 flex-1 scroll-mt-24 rounded-lg p-2 outline-none"
            >
                <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold">{etiqueta}</span>
                    {categoria && (
                        <Badge variant="secondary">{categoria}</Badge>
                    )}
                    {evento.extraido_por_ia && (
                        <OrigenBadge origen="ia" etiqueta="Extraído por IA" />
                    )}
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                        #{evento.id}
                    </span>
                </header>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    <time dateTime={evento.fecha ?? undefined}>
                        {formatFecha(evento.fecha)}
                    </time>
                    {evento.contrato_codigo && (
                        <> · Contrato {evento.contrato_codigo}</>
                    )}
                    {evento.dias !== null && <> · {formatDias(evento.dias)}</>}
                    {evento.monto !== null && (
                        <> · {formatMonto(evento.monto)}</>
                    )}
                </p>
                <p className="mt-1.5 text-sm text-pretty">
                    {evento.descripcion}
                </p>

                {evento.extracto_fuente && (
                    <Collapsible className="mt-2">
                        <CollapsibleTrigger className="group inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                            <Quote className="size-3" aria-hidden />
                            Ver fuente
                            <ChevronDown
                                className="size-3 transition-transform group-data-[state=open]:rotate-180"
                                aria-hidden
                            />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 rounded-md border-l-2 border-brand-action bg-muted/60 px-3 py-2 text-sm">
                            <blockquote className="italic">
                                “{evento.extracto_fuente}”
                            </blockquote>
                            {evento.documento_origen && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground not-italic">
                                    <FileText className="size-3" aria-hidden />
                                    {evento.documento_origen}
                                </p>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </article>
        </li>
    );
}

export function Timeline({ eventos }: { eventos: EventoTimeline[] }) {
    if (eventos.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Todavía no hay eventos registrados para este proveedor.
            </p>
        );
    }

    return (
        <ol aria-label="Línea de tiempo de eventos">
            {eventos.map((evento) => (
                <TimelineItem key={evento.id} evento={evento} />
            ))}
        </ol>
    );
}
