import { Head, router } from '@inertiajs/react';
import { Check, FileSearch, Plus, RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DestinoSelector } from '@/components/dictamenes/destino-selector';
import { DictamenInput } from '@/components/dictamenes/dictamen-input';
import { EventoEditor } from '@/components/dictamenes/evento-editor';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAnalizarDictamen } from '@/hooks/use-analizar-dictamen';
import {
    armarPayload,
    desdeExtraccion,
    destinoSugerido,
    erroresPorEvento,
    eventoManual,
} from '@/lib/dictamen';
import type { Destino, EventoBorrador } from '@/lib/dictamen';
import { cn } from '@/lib/utils';
import { confirmar, create } from '@/routes/dictamenes';
import type { CargarDictamenProps, ExtraccionDictamen } from '@/types';

const PASOS = [
    'Pegar el dictamen',
    'Revisar lo extraído',
    'Guardar en el historial',
];

function Stepper({ actual }: { actual: number }) {
    return (
        <ol
            className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm"
            aria-label="Pasos"
        >
            {PASOS.map((paso, i) => {
                const estado =
                    i < actual
                        ? 'hecho'
                        : i === actual
                          ? 'actual'
                          : 'pendiente';

                return (
                    <li
                        key={paso}
                        className="flex items-center gap-2"
                        aria-current={estado === 'actual' ? 'step' : undefined}
                    >
                        <span
                            className={cn(
                                'grid size-6 place-items-center rounded-full border text-xs font-semibold',
                                estado === 'hecho' &&
                                    'border-brand-teal bg-brand-teal text-neutral-950',
                                estado === 'actual' &&
                                    'border-foreground text-foreground',
                                estado === 'pendiente' &&
                                    'text-muted-foreground',
                            )}
                        >
                            {estado === 'hecho' ? (
                                <Check className="size-3.5" aria-hidden />
                            ) : (
                                i + 1
                            )}
                        </span>
                        <span
                            className={cn(
                                estado === 'pendiente'
                                    ? 'text-muted-foreground'
                                    : 'font-medium',
                            )}
                        >
                            {paso}
                        </span>
                        {i < PASOS.length - 1 && (
                            <span
                                className="mx-1 hidden h-px w-8 bg-border sm:block"
                                aria-hidden
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

function ResumenExtraccion({ extraccion }: { extraccion: ExtraccionDictamen }) {
    const datos = [
        ['Proveedor mencionado', extraccion.proveedor_mencionado],
        [
            'Contrato',
            [extraccion.contrato.codigo, extraccion.contrato.objeto]
                .filter(Boolean)
                .join(' · '),
        ],
        ['Dependencia', extraccion.dependencia_mencionada],
    ] as const;

    return (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-pretty">{extraccion.resumen}</p>
            <dl className="grid gap-2 text-xs sm:grid-cols-3">
                {datos.map(([etiqueta, valor]) => (
                    <div key={etiqueta}>
                        <dt className="text-muted-foreground">{etiqueta}</dt>
                        <dd className="font-medium">
                            {valor || 'No figura en el documento'}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function CargarDictamen(props: CargarDictamenProps) {
    const [texto, setTexto] = useState('');
    const [documento, setDocumento] = useState('');
    const [eventos, setEventos] = useState<EventoBorrador[]>([]);
    const [destino, setDestino] = useState<Destino | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [guardando, setGuardando] = useState(false);
    const analisis = useAnalizarDictamen();
    const extraccion = analisis.data;

    const analizar = async () => {
        const resultado = await analisis.ejecutar(texto);

        if (!resultado) {
            toast.error('No se pudo analizar el dictamen. Intentá de nuevo.');

            return;
        }

        setEventos(desdeExtraccion(resultado.eventos));
        setDestino(destinoSugerido(resultado, props));
        setErrores({});

        if (resultado.eventos.length === 0) {
            toast.info('La IA no encontró eventos. Podés agregarlos a mano.');
        }
    };

    const reiniciar = () => {
        analisis.reiniciar();
        setEventos([]);
        setDestino(null);
        setErrores({});
    };

    const actualizarEvento = (evento: EventoBorrador) =>
        setEventos((actuales) =>
            actuales.map((e) => (e.clave === evento.clave ? evento : e)),
        );

    const quitarEvento = (clave: string) =>
        setEventos((actuales) => actuales.filter((e) => e.clave !== clave));

    const agregarEvento = () => {
        const indice = eventos.length;
        setEventos((actuales) => [...actuales, eventoManual()]);

        // Lleva el foco a la descripción del evento nuevo cuando ya está en pantalla.
        requestAnimationFrame(() => {
            const campo = document.getElementById(
                `evento-${indice}-descripcion`,
            );
            campo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            campo?.focus({ preventScroll: true });
        });
    };

    const deIa = eventos.filter((e) => e.extraido_por_ia).length;

    const guardar = () => {
        if (!destino) {
            return;
        }

        router.post(
            confirmar.url(),
            armarPayload(destino, documento, eventos),
            {
                onStart: () => setGuardando(true),
                onFinish: () => setGuardando(false),
                onError: (e) => {
                    setErrores(e);
                    toast.error('Revisá los campos marcados antes de guardar.');
                },
            },
        );
    };

    const paso = extraccion
        ? destino?.proveedor && destino.dependencia
            ? 2
            : 1
        : 0;
    const erroresEvento = erroresPorEvento(errores);

    return (
        <>
            <Head title="Cargar dictamen" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Cargar dictamen"
                    description="La IA lee el documento y propone los eventos con su cita textual. Vos revisás, corregís y confirmás antes de que se guarde nada."
                />
                <Stepper actual={paso} />

                <Card className="gap-4">
                    <CardHeader className="flex-row items-start justify-between gap-2">
                        <div className="space-y-1.5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileSearch
                                    className="size-4 text-muted-foreground"
                                    aria-hidden
                                />
                                1. Documento
                            </CardTitle>
                            <CardDescription>
                                Usá solo documentos anonimizados.
                            </CardDescription>
                        </div>
                        {extraccion && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={reiniciar}
                            >
                                <RotateCcw />
                                Empezar de nuevo
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <DictamenInput
                            texto={texto}
                            documento={documento}
                            onTextoChange={setTexto}
                            onDocumentoChange={setDocumento}
                            onAnalizar={analizar}
                            analizando={analisis.cargando}
                        />
                    </CardContent>
                </Card>

                {extraccion && destino && (
                    <>
                        <Card className="gap-4">
                            <CardHeader className="flex-row items-start justify-between gap-2">
                                <div className="space-y-1.5">
                                    <CardTitle className="text-base">
                                        2. Eventos del documento
                                    </CardTitle>
                                    <CardDescription>
                                        Revisá cada evento contra su extracto.
                                        Podés editarlo, quitarlo o agregar lo
                                        que la IA no detectó.
                                    </CardDescription>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                    {deIa} de la IA · {eventos.length - deIa} a
                                    mano
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ResumenExtraccion extraccion={extraccion} />
                                {eventos.length > 0 ? (
                                    <ol className="space-y-3">
                                        {eventos.map((evento, i) => (
                                            <EventoEditor
                                                key={evento.clave}
                                                indice={i}
                                                evento={evento}
                                                errores={erroresEvento[i] ?? {}}
                                                onChange={actualizarEvento}
                                                onQuitar={() =>
                                                    quitarEvento(evento.clave)
                                                }
                                            />
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        No hay eventos para guardar. Agregá uno
                                        a mano si el documento lo menciona.
                                    </p>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={agregarEvento}
                                    className="w-full border-dashed"
                                >
                                    <Plus />
                                    Agregar evento a mano
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="gap-4">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    3. ¿A qué historial pertenece?
                                </CardTitle>
                                <CardDescription>
                                    Preseleccionamos lo que coincide con el
                                    documento. Confirmá o corregí antes de
                                    guardar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <DestinoSelector
                                    destino={destino}
                                    onChange={setDestino}
                                    proveedores={props.proveedores}
                                    dependencias={props.dependencias}
                                    errores={errores}
                                />
                                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Cada evento se guarda con su origen:
                                        “Extraído por IA” o “Agregado a mano”.
                                    </p>
                                    <Button
                                        onClick={guardar}
                                        disabled={
                                            guardando ||
                                            eventos.length === 0 ||
                                            !destino.proveedor
                                        }
                                    >
                                        {guardando ? <Spinner /> : <Save />}
                                        Guardar en el historial
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

CargarDictamen.layout = {
    breadcrumbs: [
        {
            title: 'Cargar dictamen',
            href: create(),
        },
    ],
};
