import { RefreshCw, Sparkles, ThumbsUp, TriangleAlert } from 'lucide-react';
import { OrigenBadge } from '@/components/origen-badge';
import { EventoCita } from '@/components/proveedores/evento-cita';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useResumenIa } from '@/hooks/use-resumen-ia';
import { SEMAFORO } from '@/lib/semaforo';
import { cn } from '@/lib/utils';
import type { NivelSemaforo, Recomendacion, ResumenIa } from '@/types';

const RECOMENDACION: Record<
    Recomendacion,
    { etiqueta: string; nivel: NivelSemaforo }
> = {
    contratar: { etiqueta: 'Contratar', nivel: 'verde' },
    'contratar con condiciones': {
        etiqueta: 'Contratar con condiciones',
        nivel: 'amarillo',
    },
    evitar: { etiqueta: 'Evitar por ahora', nivel: 'rojo' },
};

/** Convierte las referencias "#12" del texto en links al evento citado. */
function TextoConCitas({ texto }: { texto: string }) {
    return (
        <>
            {texto
                .split(/(#\d+)/g)
                .map((parte, i) =>
                    /^#\d+$/.test(parte) ? (
                        <EventoCita key={i} id={Number(parte.slice(1))} />
                    ) : (
                        parte
                    ),
                )}
        </>
    );
}

function Lista({
    titulo,
    items,
    icono: Icono,
    clase,
}: {
    titulo: string;
    items: string[];
    icono: typeof ThumbsUp;
    clase: string;
}) {
    return (
        <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {titulo}
            </h3>
            <ul className="space-y-1.5 text-sm">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <Icono
                            className={cn('mt-0.5 size-4 shrink-0', clase)}
                            aria-hidden
                        />
                        <span>
                            <TextoConCitas texto={item} />
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Resultado({ data }: { data: ResumenIa }) {
    const recomendacion = RECOMENDACION[data.recomendacion];
    const { icono: Icono, suave } = SEMAFORO[recomendacion.nivel];

    return (
        <div className="space-y-5">
            <p className="text-sm leading-relaxed text-pretty">
                <TextoConCitas texto={data.resumen} />
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Lista
                    titulo="Fortalezas"
                    items={data.fortalezas}
                    icono={ThumbsUp}
                    clase="text-ok"
                />
                <Lista
                    titulo="Alertas"
                    items={data.alertas}
                    icono={TriangleAlert}
                    clase="text-warn"
                />
            </div>
            <div
                className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    suave,
                )}
            >
                <Icono className="size-5 shrink-0" aria-hidden />
                <div>
                    <div className="text-xs">
                        Sugerencia según los antecedentes
                    </div>
                    <div className="font-semibold">
                        {recomendacion.etiqueta}
                    </div>
                </div>
            </div>
            {data.eventos_citados.length > 0 && (
                <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    Eventos citados:
                    {data.eventos_citados.map((id) => (
                        <EventoCita key={id} id={id} />
                    ))}
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                Generado automáticamente a partir de los registros. Puede
                contener errores: la decisión final es de la unidad de compras.
            </p>
        </div>
    );
}

export function ResumenIaPanel({ proveedorId }: { proveedorId: number }) {
    const { status, data, error, cargando, ejecutar } = useResumenIa();
    const generar = () => void ejecutar(proveedorId);

    return (
        <Card className="gap-4">
            <CardHeader className="flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-ai" aria-hidden />
                    Resumen de la historia clínica
                </CardTitle>
                {data && <OrigenBadge origen="ia" />}
            </CardHeader>
            <CardContent aria-live="polite" aria-busy={cargando}>
                {status === 'idle' && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            La IA lee los contratos, eventos y evaluaciones
                            registrados y resume fortalezas y alertas, citando
                            cada evento en el que se basa.
                        </p>
                        <Button onClick={generar} className="w-full sm:w-auto">
                            <Sparkles />
                            Generar resumen con IA
                        </Button>
                    </div>
                )}

                {cargando && !data && (
                    <div className="space-y-2" aria-label="Generando resumen">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-4/5" />
                        <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                            <Spinner /> Analizando antecedentes…
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-3">
                        <p className="text-sm text-crit-foreground">{error}</p>
                        <Button variant="outline" onClick={generar}>
                            <RefreshCw />
                            Reintentar
                        </Button>
                    </div>
                )}

                {data && <Resultado data={data} />}
            </CardContent>
        </Card>
    );
}
