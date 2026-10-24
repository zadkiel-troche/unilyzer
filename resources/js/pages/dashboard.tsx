import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronRight,
    Building2,
    FileText,
    MessageSquareWarning,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BusquedaInput } from '@/components/busqueda/busqueda-input';
import { MetricTile } from '@/components/proveedores/metric-tile';
import { ScoreRing } from '@/components/proveedores/score-ring';
import { SemaforoBadge } from '@/components/proveedores/semaforo-badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { etiquetaRubro } from '@/lib/eventos';
import { formatMonto, formatMontoCompacto, formatNumero } from '@/lib/format';
import { dashboard } from '@/routes';
import { index as proveedores, show } from '@/routes/proveedores';
import type { DashboardProps, ProveedorRanking } from '@/types';

type RankingProps = {
    titulo: string;
    descripcion: string;
    icono: LucideIcon;
    items: ProveedorRanking[];
};

function Ranking({ titulo, descripcion, icono: Icono, items }: RankingProps) {
    return (
        <Card className="gap-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-base">
                    <span
                        className="grid size-7 place-items-center rounded-md border bg-muted/60 text-muted-foreground"
                        aria-hidden
                    >
                        <Icono className="size-3.5" />
                    </span>
                    {titulo}
                </CardTitle>
                <CardDescription>{descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="px-3">
                <ol className="space-y-0.5">
                    {items.map((p, i) => (
                        <li key={p.id}>
                            <Link
                                href={show(p.id)}
                                prefetch
                                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                                <span className="w-4 text-xs text-muted-foreground tabular-nums">
                                    {i + 1}
                                </span>
                                <ScoreRing
                                    puntaje={p.puntaje}
                                    nivel={p.semaforo.nivel}
                                    size="sm"
                                    className="size-10"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                        {p.nombre}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {etiquetaRubro(p.rubro)} · {p.motivo}
                                    </span>
                                </span>
                                <SemaforoBadge
                                    semaforo={p.semaforo}
                                    className="hidden sm:inline-flex"
                                />
                                <ChevronRight
                                    className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                                    aria-hidden
                                />
                            </Link>
                        </li>
                    ))}
                </ol>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    kpis,
    criticos,
    confiables,
}: DashboardProps) {
    const { auth } = usePage().props;
    const nombre = auth.user.name.split(' ')[0];

    const buscar = (q: string) => router.visit(proveedores({ query: { q } }));

    return (
        <>
            <Head title="Panel" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                <section className="superficie-marca relative animate-in overflow-hidden rounded-2xl border border-white/10 px-5 py-8 text-white duration-500 fade-in slide-in-from-bottom-2 sm:px-10 sm:py-12">
                    <div className="relative max-w-3xl space-y-3">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-2 text-xs text-white/70">
                            <span className="relative flex size-2" aria-hidden>
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-teal/60" />
                                <span className="relative inline-flex size-2 rounded-full bg-brand-teal" />
                            </span>
                            Hola, {nombre} · IA lista para consultar
                        </p>
                        <h1 className="texto-degradado text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[2.6rem]">
                            ¿Con quién conviene contratar?
                        </h1>
                        <p className="max-w-2xl text-sm text-pretty text-white/60 sm:text-base">
                            Consultá la historia clínica de cada proveedor en
                            lenguaje natural. Cada respuesta muestra cómo se
                            interpretó la pregunta y en qué registros se basa.
                        </p>
                    </div>
                    <BusquedaInput
                        onBuscar={buscar}
                        sobreOscuro
                        className="relative mt-6 max-w-3xl text-foreground"
                    />
                </section>

                <section
                    aria-labelledby="indicadores-titulo"
                    className="space-y-3"
                >
                    <h2 id="indicadores-titulo" className="etiqueta-seccion">
                        Indicadores generales
                    </h2>
                    <div className="grid animate-in grid-cols-2 gap-3 delay-150 duration-500 fill-mode-both fade-in slide-in-from-bottom-2 lg:grid-cols-4">
                        <MetricTile
                            label="Proveedores"
                            value={formatNumero(kpis.proveedores)}
                            icon={Building2}
                            hint="con historial registrado"
                        />
                        <MetricTile
                            label="Contratos"
                            value={formatNumero(kpis.contratos)}
                            icon={FileText}
                            hint="2023 – 2026"
                        />
                        <MetricTile
                            label="Monto contratado"
                            value={
                                <span title={formatMonto(kpis.monto_total)}>
                                    {formatMontoCompacto(kpis.monto_total)}
                                </span>
                            }
                            icon={Wallet}
                            hint="suma de todos los contratos"
                        />
                        <MetricTile
                            label="Reclamos"
                            value={formatNumero(kpis.reclamos)}
                            icon={MessageSquareWarning}
                            tone="alerta"
                            hint="registrados por las dependencias"
                        />
                    </div>
                </section>

                <div className="grid animate-in gap-6 delay-300 duration-500 fill-mode-both fade-in slide-in-from-bottom-2 lg:grid-cols-2">
                    <Ranking
                        titulo="Requieren atención"
                        descripcion="Los 5 puntajes más bajos según los antecedentes registrados."
                        icono={MessageSquareWarning}
                        items={criticos}
                    />
                    <Ranking
                        titulo="Mejor desempeño"
                        descripcion="Los 5 puntajes más altos según los antecedentes registrados."
                        icono={Building2}
                        items={confiables}
                    />
                </div>

                <Link
                    href={proveedores()}
                    className="inline-flex items-center gap-1 self-start text-sm font-medium text-link underline-offset-4 hover:underline"
                >
                    Ver todos los proveedores{' '}
                    <ArrowRight className="size-4" aria-hidden />
                </Link>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Panel',
            href: dashboard(),
        },
    ],
};
