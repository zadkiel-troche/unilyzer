import { useCallback, useEffect, useRef, useState } from 'react';
import { dividirEnFrases, elegirVoz, IDIOMA_VOZ } from '@/lib/voz';

/** Caracteres por segundo estimados cuando la voz no informa su avance. */
const CARACTERES_POR_TICK = 3;
const TICK_MS = 200;

/**
 * Lectura en voz alta con speechSynthesis. Expone `progreso` (caracteres ya
 * leídos) para subtitular sincronizado con la voz.
 */
export function useSintesisVoz() {
    const soportado =
        typeof window !== 'undefined' && 'speechSynthesis' in window;
    const [hablando, setHablando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const voz = useRef<SpeechSynthesisVoice | null>(null);
    const sesion = useRef(0);
    const reloj = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!soportado) {
            return;
        }

        const cargarVoz = () => {
            voz.current = elegirVoz(window.speechSynthesis.getVoices());
        };

        cargarVoz();
        window.speechSynthesis.addEventListener('voiceschanged', cargarVoz);

        return () => {
            window.speechSynthesis.removeEventListener(
                'voiceschanged',
                cargarVoz,
            );
            window.speechSynthesis.cancel();
            window.clearInterval(reloj.current);
        };
    }, [soportado]);

    const callar = useCallback(() => {
        sesion.current++;
        window.clearInterval(reloj.current);

        if (soportado) {
            window.speechSynthesis.cancel();
        }

        setHablando(false);
    }, [soportado]);

    const hablar = useCallback(
        (texto: string, alTerminar?: () => void) => {
            if (!soportado || !texto.trim()) {
                alTerminar?.();

                return;
            }

            callar();
            const id = sesion.current;
            const frases = dividirEnFrases(texto);
            let ultimoAviso = 0;

            const terminar = () => {
                if (id !== sesion.current) {
                    return;
                }

                window.clearInterval(reloj.current);
                setProgreso(texto.length);
                setHablando(false);
                alTerminar?.();
            };

            setProgreso(0);
            setHablando(true);

            // Si la voz no emite eventos de palabra, se estima el avance.
            reloj.current = window.setInterval(() => {
                if (performance.now() - ultimoAviso > TICK_MS * 4) {
                    setProgreso((p) =>
                        Math.min(texto.length, p + CARACTERES_POR_TICK),
                    );
                }
            }, TICK_MS);

            frases.forEach((frase, i) => {
                const locucion = new SpeechSynthesisUtterance(frase.texto);
                locucion.lang = voz.current?.lang ?? IDIOMA_VOZ;
                locucion.voice = voz.current;
                locucion.rate = 1.05;

                locucion.onstart = () => {
                    if (id === sesion.current) {
                        setProgreso((p) => Math.max(p, frase.inicio));
                    }
                };
                locucion.onboundary = (e) => {
                    if (id === sesion.current) {
                        ultimoAviso = performance.now();
                        setProgreso(
                            frase.inicio + e.charIndex + (e.charLength || 0),
                        );
                    }
                };
                locucion.onerror = (e) => {
                    if (e.error !== 'interrupted' && e.error !== 'canceled') {
                        terminar();
                    }
                };

                if (i === frases.length - 1) {
                    locucion.onend = terminar;
                }

                window.speechSynthesis.speak(locucion);
            });
        },
        [soportado, callar],
    );

    return { soportado, hablando, progreso, hablar, callar };
}
