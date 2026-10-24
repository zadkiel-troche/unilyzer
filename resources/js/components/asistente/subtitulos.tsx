import { useEffect, useRef } from 'react';
import type { EstadoAsistente, Mensaje } from '@/hooks/use-asistente';
import { cn } from '@/lib/utils';

const ETIQUETAS: Record<EstadoAsistente, string> = {
    inactivo: 'Tocá el micrófono y preguntá lo que quieras',
    escuchando: 'Te escucho…',
    pensando: 'Buscando en los antecedentes…',
    hablando: 'Respondiendo',
};

function PuntosPensando() {
    return (
        <span className="inline-flex gap-1" aria-hidden>
            {[0, 150, 300].map((retraso) => (
                <span
                    key={retraso}
                    className="size-1.5 animate-bounce rounded-full bg-brand-teal"
                    style={{ animationDelay: `${retraso}ms` }}
                />
            ))}
        </span>
    );
}

type Props = {
    estado: EstadoAsistente;
    parcial: string;
    ultimaPregunta?: Mensaje;
    ultimaRespuesta?: Mensaje;
    /** Caracteres de la respuesta ya leídos en voz alta (efecto karaoke). */
    progreso: number;
};

export function Subtitulos({
    estado,
    parcial,
    ultimaPregunta,
    ultimaRespuesta,
    progreso,
}: Props) {
    const respuesta = ultimaRespuesta?.texto ?? '';
    const leido =
        estado === 'hablando' ? respuesta.slice(0, progreso) : respuesta;
    const pendiente = estado === 'hablando' ? respuesta.slice(progreso) : '';
    const pregunta = estado === 'escuchando' ? parcial : ultimaPregunta?.texto;
    const caja = useRef<HTMLParagraphElement>(null);

    // Acompaña la lectura: mantiene visible la parte que se está diciendo.
    useEffect(() => {
        const el = caja.current;

        if (el && respuesta.length > 0) {
            el.scrollTop =
                (progreso / respuesta.length) *
                (el.scrollHeight - el.clientHeight);
        }
    }, [progreso, respuesta.length]);

    return (
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
            {/* Los lectores de pantalla reciben la respuesta completa, no el efecto karaoke. */}
            <p className="sr-only" aria-live="polite">
                {estado === 'hablando' || estado === 'inactivo'
                    ? respuesta
                    : ETIQUETAS[estado]}
            </p>
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-teal uppercase">
                {estado === 'pensando' && <PuntosPensando />}
                {ETIQUETAS[estado]}
            </p>

            {pregunta && (
                <p
                    key={pregunta}
                    className={cn(
                        'animate-in text-base text-pretty duration-300 fade-in slide-in-from-bottom-1',
                        estado === 'escuchando'
                            ? 'text-white'
                            : 'text-white/55',
                    )}
                >
                    “{pregunta}”
                </p>
            )}

            {respuesta && estado !== 'escuchando' && estado !== 'pensando' && (
                <p
                    key={ultimaRespuesta?.id}
                    ref={caja}
                    aria-hidden
                    className={cn(
                        'max-h-40 animate-in overflow-y-auto scroll-smooth text-lg leading-relaxed text-pretty duration-500 fade-in sm:text-xl',
                        ultimaRespuesta?.error && 'text-crit-foreground',
                    )}
                >
                    <span
                        className={
                            ultimaRespuesta?.error ? undefined : 'text-white'
                        }
                    >
                        {leido}
                    </span>
                    <span className="text-white/30">{pendiente}</span>
                </p>
            )}
        </div>
    );
}
