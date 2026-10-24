import { useEffect, useRef } from 'react';

/**
 * Mide el volumen del micrófono (0 a 1) en cada cuadro mientras `activo` sea
 * true. Llama a `onNivel` fuera del ciclo de render para animar sin re-renderizar.
 */
export function useNivelMicrofono(
    activo: boolean,
    onNivel: (nivel: number) => void,
) {
    const alNivel = useRef(onNivel);

    useEffect(() => {
        alNivel.current = onNivel;
    }, [onNivel]);

    useEffect(() => {
        if (!activo || !navigator.mediaDevices?.getUserMedia) {
            return;
        }

        let cuadro = 0;
        let stream: MediaStream | null = null;
        let contexto: AudioContext | null = null;
        let cancelado = false;

        void navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((s) => {
                if (cancelado) {
                    s.getTracks().forEach((t) => t.stop());

                    return;
                }

                stream = s;
                contexto = new AudioContext();
                const analizador = contexto.createAnalyser();
                analizador.fftSize = 512;
                contexto.createMediaStreamSource(s).connect(analizador);
                const muestras = new Uint8Array(analizador.fftSize);
                let suavizado = 0;

                const medir = () => {
                    analizador.getByteTimeDomainData(muestras);
                    let suma = 0;

                    for (const m of muestras) {
                        const v = (m - 128) / 128;
                        suma += v * v;
                    }

                    const rms = Math.sqrt(suma / muestras.length);
                    suavizado = suavizado * 0.75 + Math.min(1, rms * 5) * 0.25;
                    alNivel.current(suavizado);
                    cuadro = requestAnimationFrame(medir);
                };

                medir();
            })
            .catch(() => {
                // Sin permiso de micrófono: la animación queda en reposo.
            });

        return () => {
            cancelado = true;
            cancelAnimationFrame(cuadro);
            stream?.getTracks().forEach((t) => t.stop());
            void contexto?.close();
            alNivel.current(0);
        };
    }, [activo]);
}
