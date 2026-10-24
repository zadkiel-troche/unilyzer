export const IDIOMA_VOZ = 'es-ES';

export type Frase = { texto: string; inicio: number };

/** Divide el texto en frases (Chrome corta las locuciones largas) conservando su posición. */
export function dividirEnFrases(texto: string): Frase[] {
    return [...texto.matchAll(/[^.!?;]+[.!?;]*\s*/g)]
        .map((m) => ({ texto: m[0], inicio: m.index ?? 0 }))
        .filter((f) => f.texto.trim() !== '');
}

/** Elige la mejor voz en español disponible, priorizando acentos latinoamericanos. */
export function elegirVoz(
    voces: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
    const puntaje = (v: SpeechSynthesisVoice) => {
        if (!v.lang.toLowerCase().startsWith('es')) {
            return -1;
        }

        let p = 1;

        if (/es[-_](PY|AR|UY|419|US|MX)/i.test(v.lang)) {
            p += 2;
        }

        if (/google|natural|neural|premium|enhanced/i.test(v.name)) {
            p += 2;
        }

        return p;
    };

    const [mejor] = [...voces].sort((a, b) => puntaje(b) - puntaje(a));

    return mejor && puntaje(mejor) > 0 ? mejor : null;
}

const ERRORES_RECONOCIMIENTO: Record<string, string> = {
    'not-allowed': 'Permití el acceso al micrófono para hablar con la IA.',
    'service-not-allowed':
        'El navegador no permite usar el reconocimiento de voz.',
    'audio-capture': 'No se encontró un micrófono.',
    network: 'El reconocimiento de voz necesita conexión a internet.',
};

/** Devuelve null para errores que no hace falta mostrar (silencio, cancelación). */
export function mensajeErrorReconocimiento(codigo: string): string | null {
    if (codigo === 'no-speech' || codigo === 'aborted') {
        return null;
    }

    return (
        ERRORES_RECONOCIMIENTO[codigo] ??
        'No pude escucharte bien. Intentá de nuevo.'
    );
}
