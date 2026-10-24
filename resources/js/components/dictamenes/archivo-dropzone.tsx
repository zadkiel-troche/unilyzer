import { CircleAlert, FileCheck2, FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useExtraerTexto } from '@/hooks/use-extraer-texto';
import { ACCEPT, FORMATOS, MAX_MB, problemaConArchivo } from '@/lib/documentos';
import { formatNumero } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TextoExtraido } from '@/types';

type Props = {
    onTexto: (resultado: TextoExtraido) => void;
    deshabilitado?: boolean;
};

/** Arrastrar o elegir un documento; el backend lo convierte a texto. */
export function ArchivoDropzone({ onTexto, deshabilitado = false }: Props) {
    const lector = useExtraerTexto();
    const input = useRef<HTMLInputElement>(null);
    const [arrastrando, setArrastrando] = useState(false);
    const [nombre, setNombre] = useState<string | null>(null);
    const [problema, setProblema] = useState<string | null>(null);

    const procesar = async (archivo: File | undefined) => {
        if (!archivo) {
            return;
        }

        setNombre(archivo.name);
        const invalido = problemaConArchivo(archivo);
        setProblema(invalido);

        if (invalido) {
            lector.reiniciar();

            return;
        }

        const resultado = await lector.ejecutar(archivo);

        if (resultado) {
            onTexto(resultado);
            toast.success(
                `Se leyeron ${formatNumero(resultado.caracteres)} caracteres de “${archivo.name}”.`,
            );
        }
    };

    const alSoltar = (e: DragEvent) => {
        e.preventDefault();
        setArrastrando(false);
        void procesar(e.dataTransfer.files[0]);
    };

    const alSalir = (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setArrastrando(false);
        }
    };

    const error = problema ?? lector.error;
    const listo = lector.status === 'success' && !problema;

    return (
        <div className="space-y-2">
            <input
                ref={input}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                    void procesar(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
            <button
                type="button"
                onClick={() => input.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrando(true);
                }}
                onDragLeave={alSalir}
                onDrop={alSoltar}
                disabled={deshabilitado || lector.cargando}
                aria-describedby="dropzone-formatos"
                className={cn(
                    'group flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-card px-4 py-6 text-center transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-wait',
                    arrastrando
                        ? 'scale-[1.01] border-primary bg-accent'
                        : 'hover:border-brand-action/60 hover:bg-accent/40',
                    error && 'border-crit/40',
                    listo && 'border-ok/40',
                )}
            >
                <span
                    className={cn(
                        'grid size-11 place-items-center rounded-full transition-transform',
                        listo
                            ? 'bg-ok-soft text-ok-foreground'
                            : 'bg-secondary text-secondary-foreground',
                        arrastrando && 'animate-bounce',
                    )}
                    aria-hidden
                >
                    {lector.cargando ? (
                        <Spinner className="size-5" />
                    ) : listo ? (
                        <FileCheck2 className="size-5" />
                    ) : (
                        <FileUp className="size-5 transition-transform group-hover:-translate-y-0.5" />
                    )}
                </span>

                <span className="text-sm font-medium">
                    {lector.cargando
                        ? `Leyendo “${nombre}”…`
                        : listo
                          ? `“${nombre}” cargado · elegir otro archivo`
                          : arrastrando
                            ? 'Soltá el archivo para leerlo'
                            : 'Arrastrá un documento o hacé clic para elegirlo'}
                </span>

                <span
                    id="dropzone-formatos"
                    className="flex flex-wrap justify-center gap-1.5"
                >
                    {FORMATOS.map((f) => (
                        <span
                            key={f.etiqueta}
                            className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            title={f.extensiones.map((e) => `.${e}`).join(' ')}
                        >
                            {f.etiqueta}
                        </span>
                    ))}
                    <span className="px-1 text-[11px] text-muted-foreground">
                        · hasta {MAX_MB} MB
                    </span>
                </span>
            </button>

            {error && (
                <p
                    role="alert"
                    className="flex items-start gap-1.5 text-xs text-crit-foreground"
                >
                    <CircleAlert
                        className="mt-px size-3.5 shrink-0"
                        aria-hidden
                    />
                    {error}
                </p>
            )}
        </div>
    );
}
