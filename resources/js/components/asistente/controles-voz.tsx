import { Keyboard, Mic, Volume2, VolumeX, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { EstadoAsistente } from '@/hooks/use-asistente';
import { cn } from '@/lib/utils';

function BotonRedondo({
    etiqueta,
    onClick,
    activo = false,
    disabled = false,
    children,
}: {
    etiqueta: string;
    onClick: () => void;
    activo?: boolean;
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={etiqueta}
                    aria-pressed={activo}
                    className={cn(
                        'grid size-12 place-items-center rounded-full border border-white/15 text-white transition-all hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-brand-teal/50 focus-visible:outline-none active:scale-95 disabled:opacity-40 [&_svg]:size-5',
                        activo ? 'bg-white/15' : 'bg-white/5',
                    )}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent>{etiqueta}</TooltipContent>
        </Tooltip>
    );
}

function Ecualizador() {
    return (
        <span className="flex h-6 items-end gap-1" aria-hidden>
            {[0, 180, 90, 270].map((retraso) => (
                <span
                    key={retraso}
                    className="voz-barra h-full w-1.5 rounded-full bg-brand-navy"
                    style={{ animationDelay: `${retraso}ms` }}
                />
            ))}
        </span>
    );
}

const ETIQUETA_MIC: Record<EstadoAsistente, string> = {
    inactivo: 'Empezar a hablar',
    escuchando: 'Enviar lo que dije',
    pensando: 'Pensando',
    hablando: 'Interrumpir y hablar',
};

type Props = {
    estado: EstadoAsistente;
    vozSoportada: boolean;
    silenciado: boolean;
    tecladoVisible: boolean;
    onMicrofono: () => void;
    onDetener: () => void;
    onSilencio: () => void;
    onTeclado: () => void;
};

export function ControlesVoz({
    estado,
    vozSoportada,
    silenciado,
    tecladoVisible,
    onMicrofono,
    onDetener,
    onSilencio,
    onTeclado,
}: Props) {
    const escuchando = estado === 'escuchando';

    return (
        <div className="flex items-center justify-center gap-4 sm:gap-6">
            <BotonRedondo
                etiqueta={tecladoVisible ? 'Ocultar teclado' : 'Escribir'}
                onClick={onTeclado}
                activo={tecladoVisible}
            >
                <Keyboard />
            </BotonRedondo>
            <BotonRedondo
                etiqueta={silenciado ? 'Activar la voz' : 'Silenciar la voz'}
                onClick={onSilencio}
                activo={silenciado}
            >
                {silenciado ? <VolumeX /> : <Volume2 />}
            </BotonRedondo>

            <div className="relative">
                {escuchando && (
                    <span
                        className="absolute inset-0 animate-ping rounded-full bg-brand-teal/40"
                        aria-hidden
                    />
                )}
                <button
                    type="button"
                    onClick={onMicrofono}
                    disabled={!vozSoportada || estado === 'pensando'}
                    aria-label={ETIQUETA_MIC[estado]}
                    className={cn(
                        'relative grid size-20 place-items-center rounded-full shadow-2xl transition-all duration-300 focus-visible:ring-4 focus-visible:ring-brand-teal/50 focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
                        escuchando
                            ? 'scale-105 bg-brand-teal text-brand-navy shadow-brand-teal/40'
                            : 'bg-white text-brand-navy shadow-brand-action/30 hover:scale-105',
                    )}
                >
                    {escuchando ? (
                        <Ecualizador />
                    ) : estado === 'pensando' ? (
                        <Spinner className="size-7" />
                    ) : (
                        <Mic className="size-8" />
                    )}
                </button>
            </div>

            <BotonRedondo
                etiqueta="Detener"
                onClick={onDetener}
                disabled={estado === 'inactivo'}
            >
                <X />
            </BotonRedondo>
        </div>
    );
}
