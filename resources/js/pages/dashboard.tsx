import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
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
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icono
                        className="size-4 text-muted-foreground"
                        aria-hidden
                    />
                    {titulo}
                </CardTitle>
                <CardDescription>{descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="px-3">
                <ol className="divide-y">
                    {items.map((p, i) => (
                        <li key={p.id}>
                            <Link
                                href={show(p.id)}
                                prefetch
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
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
                <section className="relative overflow-hidden rounded-2xl bg-brand-navy px-5 py-8 text-white sm:px-8 sm:py-10">
                    <div
                        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[28px] border-white/5"
                        aria-hidden
                    />
                    <div className="relative max-w-3xl space-y-2">
                        <p className="text-sm font-medium text-brand-teal">
                            Hola, {nombre}
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                            ¿Con quién conviene contratar?
                        </h1>
                        <p className="text-sm text-white/75">
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
                    aria-label="Indicadores generales"
                    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
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
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
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
                    className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
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
