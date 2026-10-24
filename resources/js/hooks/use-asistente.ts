import { useCallback, useEffect, useRef, useState } from 'react';
import { useReconocimientoVoz } from '@/hooks/use-reconocimiento-voz';
import { useSintesisVoz } from '@/hooks/use-sintesis-voz';
import { ApiError, postJson } from '@/lib/api';
import { TURNOS_DE_CONTEXTO } from '@/lib/asistente';
import { responder } from '@/routes/asistente';
import type {
    AsistenteRespuesta,
    AsistenteSolicitud,
    MensajeHistorial,
} from '@/types';

export type EstadoAsistente =
    | 'inactivo'
    | 'escuchando'
    | 'pensando'
    | 'hablando';

export type Mensaje = MensajeHistorial & {
    id: number;
    respuesta?: AsistenteRespuesta;
    error?: boolean;
};

/**
 * Orquesta una conversación por voz: escuchar → pensar → hablar. Si el turno
 * empezó por voz, al terminar de hablar vuelve a escuchar (modo manos libres).
 */
export function useAsistente() {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [pensando, setPensando] = useState(false);
    const [silenciado, setSilenciado] = useState(false);
    const voz = useSintesisVoz();
    const siguienteId = useRef(0);
    const enviarRef = useRef<(texto: string, porVoz: boolean) => void>(
        () => {},
    );
    const reconocimiento = useReconocimientoVoz(
        useCallback((texto: string) => enviarRef.current(texto, true), []),
    );

    const agregar = (mensaje: Omit<Mensaje, 'id'>) =>
        setMensajes((actuales) => [
            ...actuales,
            { ...mensaje, id: ++siguienteId.current },
        ]);

    const enviar = async (texto: string, porVoz: boolean) => {
        const solicitud: AsistenteSolicitud = {
            mensaje: texto,
            historial: mensajes
                .slice(-TURNOS_DE_CONTEXTO)
                .map(({ rol, texto: t }) => ({ rol, texto: t })),
        };

        agregar({ rol: 'usuario', texto });
        setPensando(true);

        try {
            const respuesta = await postJson<AsistenteRespuesta>(
                responder.url(),
                solicitud,
            );
            agregar({
                rol: 'asistente',
                texto: respuesta.respuesta,
                respuesta,
            });
            setPensando(false);

            if (!silenciado) {
                voz.hablar(respuesta.respuesta, () => {
                    if (porVoz) {
                        reconocimiento.escuchar();
                    }
                });
            }
        } catch (e) {
            setPensando(false);
            agregar({
                rol: 'asistente',
                texto:
                    e instanceof ApiError
                        ? e.message
                        : 'No pude responder. Intentá de nuevo.',
                error: true,
            });
        }
    };

    useEffect(() => {
        enviarRef.current = (texto, porVoz) => void enviar(texto, porVoz);
    });

    const estado: EstadoAsistente = reconocimiento.escuchando
        ? 'escuchando'
        : pensando
          ? 'pensando'
          : voz.hablando
            ? 'hablando'
            : 'inactivo';

    /** Botón principal: escuchar, o enviar lo dicho si ya está escuchando. */
    const alternarMicrofono = () => {
        if (reconocimiento.escuchando) {
            reconocimiento.detener();

            return;
        }

        voz.callar();
        reconocimiento.escuchar();
    };

    /** Corta todo: escucha, lectura y modo manos libres. */
    const detenerTodo = () => {
        reconocimiento.cancelar();
        voz.callar();
    };

    const alternarSilencio = () => {
        if (!silenciado) {
            voz.callar();
        }

        setSilenciado(!silenciado);
    };

    return {
        estado,
        mensajes,
        silenciado,
        parcial: reconocimiento.parcial,
        errorMicrofono: reconocimiento.error,
        vozSoportada: reconocimiento.soportado,
        progresoLectura: voz.progreso,
        alternarMicrofono,
        detenerTodo,
        alternarSilencio,
        enviarTexto: (texto: string) => void enviar(texto, false),
    };
}
