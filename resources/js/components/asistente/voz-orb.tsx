import type { Ref } from 'react';
import type { EstadoAsistente } from '@/hooks/use-asistente';

type Props = {
    estado: EstadoAsistente;
    compacto?: boolean;
    /** El contenedor recibe la variable CSS --nivel desde el micrófono. */
    ref?: Ref<HTMLDivElement>;
};

/** Orbe animado que refleja el estado de la conversación. Estilos en app.css. */
export function VozOrb({ estado, compacto = false, ref }: Props) {
    return (
        <div
            ref={ref}
            className="voz-orb"
            data-estado={estado}
            data-compacto={compacto}
            aria-hidden
        >
            <span className="voz-orb__halo" />
            <span className="voz-orb__onda" />
            <span className="voz-orb__onda" />
            <span className="voz-orb__onda" />
            <span className="voz-orb__nucleo" />
        </div>
    );
}
