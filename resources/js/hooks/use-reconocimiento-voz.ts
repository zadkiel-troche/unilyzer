import { useCallback, useEffect, useRef, useState } from 'react';
import { IDIOMA_VOZ, mensajeErrorReconocimiento } from '@/lib/voz';

function constructorReconocimiento(): SpeechRecognitionConstructor | undefined {
    return typeof window === 'undefined'
        ? undefined
        : (window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

/** Dictado con la Web Speech API: devuelve la frase final al terminar de hablar. */
export function useReconocimientoVoz(onFinal: (texto: string) => void) {
    const soportado = constructorReconocimiento() !== undefined;
    const [escuchando, setEscuchando] = useState(false);
    const [parcial, setParcial] = useState('');
    const [error, setError] = useState<string | null>(null);
    const reconocimiento = useRef<SpeechRecognition | null>(null);
    const cancelado = useRef(false);
    const alFinal = useRef(onFinal);

    useEffect(() => {
        alFinal.current = onFinal;
    }, [onFinal]);

    const escuchar = useCallback(() => {
        const Reconocimiento = constructorReconocimiento();

        if (!Reconocimiento) {
            return;
        }

        reconocimiento.current?.abort();

        const r = new Reconocimiento();
        r.lang = IDIOMA_VOZ;
        r.interimResults = true;
        r.continuous = false;
        r.maxAlternatives = 1;

        let final = '';
        cancelado.current = false;

        r.onstart = () => {
            setError(null);
            setEscuchando(true);
        };
        r.onresult = (e) => {
            let provisorio = '';

            for (let i = e.resultIndex; i < e.results.length; i++) {
                const { transcript } = e.results[i][0];

                if (e.results[i].isFinal) {
                    final += transcript;
                } else {
                    provisorio += transcript;
                }
            }

            setParcial(final + provisorio);
        };
        r.onerror = (e) => setError(mensajeErrorReconocimiento(e.error));
        r.onend = () => {
            setEscuchando(false);
            setParcial('');

            if (reconocimiento.current === r) {
                reconocimiento.current = null;
            }

            if (!cancelado.current && final.trim()) {
                alFinal.current(final.trim());
            }
        };

        reconocimiento.current = r;
        r.start();
    }, []);

    /** Termina de escuchar y envía lo dicho hasta ahora. */
    const detener = useCallback(() => reconocimiento.current?.stop(), []);

    /** Termina de escuchar descartando lo dicho. */
    const cancelar = useCallback(() => {
        cancelado.current = true;
        reconocimiento.current?.abort();
    }, []);

    useEffect(() => () => reconocimiento.current?.abort(), []);

    return {
        soportado,
        escuchando,
        parcial,
        error,
        escuchar,
        detener,
        cancelar,
    };
}
