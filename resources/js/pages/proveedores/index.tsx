import { Head, usePage } from '@inertiajs/react';
import { SearchX, X } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { BusquedaInput } from '@/components/busqueda/busqueda-input';
import { InterpretacionBox } from '@/components/busqueda/interpretacion-box';
import { ModoAviso } from '@/components/busqueda/modo-aviso';
import { OrigenBadge } from '@/components/origen-badge';
import { PageHeader } from '@/components/page-header';
import { ProveedorCard } from '@/components/proveedores/proveedor-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusqueda } from '@/hooks/use-busqueda';
import { index } from '@/routes/proveedores';
import type { ResultadoBusqueda } from '@/types';

type Props = {
    proveedores: ResultadoBusqueda[];
};

function ListaResultados({ resultados }: { resultados: ResultadoBusqueda[] }) {
    return (
        <ul className="space-y-3">
            {resultados.map((r) => (
                <ProveedorCard key={r.id} resultado={r} />
            ))}
        </ul>
    );
}

function CargandoResultados() {
    return (
        <div className="space-y-3" aria-label="Buscando proveedores">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="flex gap-4 rounded-xl border bg-card p-5"
                >
                    <Skeleton className="size-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/5" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SinResultados() {
    return (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
            <SearchX
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden
            />
            <h3 className="mt-3 font-semibold">
                No hay proveedores que coincidan
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Los antecedentes registrados no alcanzan para responder esta
                pregunta. Probá con menos condiciones o con uno de los ejemplos.
            </p>
        </div>
    );
}

function consultaInicial(url: string): string {
    return new URL(url, window.location.origin).searchParams.get('q') ?? '';
}

export default function ProveedoresIndex({ proveedores }: Props) {
    const { url } = usePage();
    const inicial = consultaInicial(url);
    const { status, data, error, cargando, ejecutar, reiniciar } =
        useBusqueda();

    useEffect(() => {
        if (inicial) {
            void ejecutar(inicial);
        }
    }, [inicial, ejecutar]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const hayBusqueda = status !== 'idle';

    return (
        <>
            <Head title="Proveedores" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Proveedores"
                    description="Buscá por nombre o preguntá en lenguaje natural. Te mostramos cómo se interpretó la consulta y qué eventos respaldan cada resultado."
                />

                <BusquedaInput
                    onBuscar={ejecutar}
                    valorInicial={inicial}
                    cargando={cargando}
                    autoFocus={!inicial}
                />

                <div
                    aria-live="polite"
                    aria-busy={cargando}
                    className="space-y-4"
                >
                    {cargando && <CargandoResultados />}

                    {!cargando && status === 'error' && (
                        <p className="text-sm text-crit-foreground">
                            {error} Mientras tanto, abajo podés ver todos los
                            proveedores.
                        </p>
                    )}

                    {!cargando && data && (
                        <>
                            <InterpretacionBox respuesta={data} />
                            {data.modo === 'palabras_clave' && <ModoAviso />}
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold">
                                    {data.resultados.length === 1
                                        ? '1 proveedor encontrado'
                                        : `${data.resultados.length} proveedores encontrados`}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={reiniciar}
                                >
                                    <X />
                                    Limpiar búsqueda
                                </Button>
                            </div>
                            {data.resultados.length > 0 ? (
                                <ListaResultados resultados={data.resultados} />
                            ) : (
                                <SinResultados />
                            )}
                        </>
                    )}
                </div>

                {(!hayBusqueda || status === 'error') && (
                    <section
                        aria-labelledby="todos-titulo"
                        className="space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2
                                id="todos-titulo"
                                className="text-sm font-semibold"
                            >
                                Todos los proveedores · de mayor a menor puntaje
                            </h2>
                            <OrigenBadge origen="calculado" />
                        </div>
                        <ListaResultados resultados={proveedores} />
                    </section>
                )}
            </div>
        </>
    );
}

ProveedoresIndex.layout = {
    breadcrumbs: [
        {
            title: 'Proveedores',
            href: index(),
        },
    ],
};
