import { Head, Link } from '@inertiajs/react';
import {
    AlarmClockOff,
    ArrowLeft,
    CalendarCheck,
    ClipboardX,
    FileText,
    FileUp,
    Gavel,
    MessageSquareWarning,
    Smile,
} from 'lucide-react';
import { OrigenBadge } from '@/components/origen-badge';
import { ComponenteBar } from '@/components/proveedores/componente-bar';
import { ContratosTable } from '@/components/proveedores/contratos-table';
import { MetricTile } from '@/components/proveedores/metric-tile';
import { ReincidenciaAlert } from '@/components/proveedores/reincidencia-alert';
import { ResumenIaPanel } from '@/components/proveedores/resumen-ia-panel';
import { ScoreRing } from '@/components/proveedores/score-ring';
import { SemaforoBadge } from '@/components/proveedores/semaforo-badge';
import { Timeline } from '@/components/proveedores/timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { etiquetaRubro } from '@/lib/eventos';
import { formatDias, formatMonto, formatNota, porcentaje } from '@/lib/format';
import { COMPONENTES } from '@/lib/scoring';
import { create as cargarDictamen } from '@/routes/dictamenes';
import { index, show } from '@/routes/proveedores';
import type { HistoriaClinicaProps, Score } from '@/types';

function Encabezado({
    proveedor,
    score,
}: Pick<HistoriaClinicaProps, 'proveedor' | 'score'>) {
    return (
        <Card className="gap-0 overflow-hidden py-0">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="flex flex-col gap-5 p-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                {etiquetaRubro(proveedor.rubro)}
                            </Badge>
                            {proveedor.ficticio && (
                                <Badge
                                    variant="outline"
                                    title="Proveedor inventado para la demostración"
                                >
                                    Ficticio
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-balance">
                            {proveedor.nombre}
                        </h1>
                        {proveedor.ruc && (
                            <p className="text-sm text-muted-foreground">
                                RUC {proveedor.ruc}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-5">
                        <ScoreRing
                            puntaje={score.puntaje}
                            nivel={score.semaforo.nivel}
                        />
                        <div className="space-y-2">
                            <SemaforoBadge
                                semaforo={score.semaforo}
                                className="text-sm"
                            />
                            <p className="text-sm text-muted-foreground">
                                Evaluación final sobre{' '}
                                {score.metricas.contratos} contratos
                                registrados.
                            </p>
                            <OrigenBadge origen="calculado" />
                        </div>
                    </div>
                </div>
                <div className="space-y-4 border-t bg-muted/40 p-6 lg:border-t-0 lg:border-l">
                    <h2 className="text-sm font-semibold">¿Cómo se calcula?</h2>
                    {COMPONENTES.map(({ clave, etiqueta, peso }) => (
                        <ComponenteBar
                            key={clave}
                            etiqueta={etiqueta}
                            peso={peso}
                            componente={score.componentes[clave]}
                        />
                    ))}
                </div>
            </div>
        </Card>
    );
}

function Metricas({ metricas: m }: { metricas: Score['metricas'] }) {
    const cerrados = m.finalizados + m.rescindidos;
    const aTiempo = porcentaje(cerrados - m.contratos_con_atraso, cerrados);

    return (
        <section
            aria-label="Métricas"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7"
        >
            <MetricTile
                label="Contratos"
                value={m.contratos}
                icon={FileText}
                hint={formatMonto(m.monto_total)}
            />
            <MetricTile
                label="A tiempo"
                value={cerrados ? `${aTiempo}%` : '—'}
                icon={CalendarCheck}
                hint={`${cerrados - m.contratos_con_atraso} de ${cerrados} cerrados`}
            />
            <MetricTile
                label="Atraso promedio"
                value={
                    m.contratos_con_atraso
                        ? formatDias(m.atraso_promedio_dias)
                        : '—'
                }
                icon={AlarmClockOff}
                tone={m.atraso_promedio_dias > 30 ? 'alerta' : 'default'}
                hint="en contratos con atraso"
            />
            <MetricTile
                label="Multas"
                value={m.multas}
                icon={Gavel}
                tone={m.multas ? 'alerta' : 'default'}
                hint={m.multas ? formatMonto(m.monto_multas) : 'ninguna'}
            />
            <MetricTile
                label="Reclamos"
                value={m.reclamos}
                icon={MessageSquareWarning}
                tone={m.reclamos ? 'alerta' : 'default'}
            />
            <MetricTile
                label="Obs. técnicas"
                value={m.observaciones_tecnicas}
                icon={ClipboardX}
                tone={m.observaciones_tecnicas ? 'alerta' : 'default'}
            />
            <MetricTile
                label="Satisfacción"
                value={formatNota(m.satisfaccion_promedio)}
                icon={Smile}
                hint={`Calidad ${formatNota(m.calidad_promedio)}`}
            />
        </section>
    );
}

export default function ProveedorShow({
    proveedor,
    score,
    contratos,
    timeline,
}: HistoriaClinicaProps) {
    return (
        <>
            <Head title={`${proveedor.nombre} · Historia clínica`} />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link href={index()}>
                            <ArrowLeft />
                            Proveedores
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={cargarDictamen()}>
                            <FileUp />
                            Cargar dictamen
                        </Link>
                    </Button>
                </div>

                <Encabezado proveedor={proveedor} score={score} />
                <Metricas metricas={score.metricas} />
                <ReincidenciaAlert reincidencias={score.reincidencias} />

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <Card className="order-2 gap-4 lg:order-1">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Línea de tiempo
                            </CardTitle>
                            <CardDescription>
                                {timeline.length} eventos, del más reciente al
                                más antiguo. Abrí “Ver fuente” para leer el
                                extracto del documento original.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Timeline eventos={timeline} />
                        </CardContent>
                    </Card>
                    <aside className="order-1 lg:sticky lg:top-4 lg:order-2">
                        <ResumenIaPanel proveedorId={proveedor.id} />
                    </aside>
                </div>

                <Card className="gap-4">
                    <CardHeader>
                        <CardTitle className="text-base">Contratos</CardTitle>
                        <CardDescription>
                            Fechas pactadas y reales, atraso y evaluación de la
                            dependencia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                        <ContratosTable contratos={contratos} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProveedorShow.layout = ({ proveedor }: HistoriaClinicaProps) => ({
    breadcrumbs: [
        { title: 'Proveedores', href: index() },
        { title: proveedor.nombre, href: show(proveedor.id) },
    ],
});
