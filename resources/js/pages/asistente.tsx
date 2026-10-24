import { Head } from '@inertiajs/react';
import { Info, MicOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { ControlesVoz } from '@/components/asistente/controles-voz';
import { EntradaTexto } from '@/components/asistente/entrada-texto';
import { DependenciasCitadas } from '@/components/asistente/dependencias-citadas';
import { ProveedoresCitados } from '@/components/asistente/proveedores-citados';
import { Subtitulos } from '@/components/asistente/subtitulos';
import { Transcripcion } from '@/components/asistente/transcripcion';
import { VozOrb } from '@/components/asistente/voz-orb';
import { useAsistente } from '@/hooks/use-asistente';
import { useNivelMicrofono } from '@/hooks/use-nivel-microfono';
import { SUGERENCIAS_VOZ } from '@/lib/asistente';
import { index } from '@/routes/asistente';

export default function Asistente() {
    const asistente = useAsistente();
    const { estado, mensajes } = asistente;
    const [teclado, setTeclado] = useState(!asistente.vozSoportada);
    const orb = useRef<HTMLDivElement>(null);

    useNivelMicrofono(estado === 'escuchando', (nivel) =>
        orb.current?.style.setProperty('--nivel', nivel.toFixed(3)),
    );

    const ultimaPregunta = mensajes.findLast((m) => m.rol === 'usuario');
    const ultimaRespuesta = mensajes.findLast((m) => m.rol === 'asistente');
    const mostrarFuentes = estado !== 'escuchando' && estado !== 'pensando';
    const proveedores = mostrarFuentes
        ? (ultimaRespuesta?.respuesta?.proveedores ?? [])
        : [];
    const dependencias = mostrarFuentes
        ? (ultimaRespuesta?.respuesta?.dependencias ?? [])
        : [];
    const sinConversacion = mensajes.length === 0 && estado === 'inactivo';

    return (
        <>
            <Head title="Hablar con la IA" />
            <div className="flex flex-1 flex-col p-2 sm:p-4">
                <section
                    aria-label="Conversación por voz"
                    className="voz-escenario relative flex h-[calc(100svh-6rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl text-white"
                >
                    <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">
                                Hablar con la IA
                            </h1>
                            <p className="text-xs text-white/60">
                                Preguntá por voz sobre cualquier proveedor.
                            </p>
                        </div>
                        <Transcripcion mensajes={mensajes} />
                    </header>

                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 pb-4 sm:gap-8">
                        <VozOrb
                            ref={orb}
                            estado={estado}
                            compacto={!sinConversacion}
                        />
                        <Subtitulos
                            estado={estado}
                            parcial={asistente.parcial}
                            ultimaPregunta={ultimaPregunta}
                            ultimaRespuesta={ultimaRespuesta}
                            progreso={asistente.progresoLectura}
                        />
                        <ProveedoresCitados
                            key={ultimaRespuesta?.id}
                            proveedores={proveedores}
                        />
                        <DependenciasCitadas
                            key={`dep-${ultimaRespuesta?.id}`}
                            dependencias={dependencias}
                        />

                        {sinConversacion && (
                            <ul
                                className="flex max-w-2xl flex-wrap justify-center gap-2"
                                aria-label="Sugerencias"
                            >
                                {SUGERENCIAS_VOZ.map((s, i) => (
                                    <li
                                        key={s}
                                        className="animate-in fill-mode-both fade-in slide-in-from-bottom-2"
                                        style={{
                                            animationDelay: `${300 + i * 100}ms`,
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                asistente.enviarTexto(s)
                                            }
                                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-brand-teal/60 hover:bg-white/10 hover:text-white focus-visible:ring-[3px] focus-visible:ring-brand-teal/50 focus-visible:outline-none"
                                        >
                                            {s}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <footer className="flex flex-col items-center gap-4 p-4 sm:p-6">
                        {asistente.errorMicrofono && (
                            <p
                                role="alert"
                                className="flex items-center gap-2 text-sm text-crit-foreground"
                            >
                                <MicOff className="size-4" aria-hidden />
                                {asistente.errorMicrofono}
                            </p>
                        )}
                        {!asistente.vozSoportada && (
                            <p className="flex items-center gap-2 text-center text-xs text-white/70">
                                <Info className="size-4 shrink-0" aria-hidden />
                                Este navegador no reconoce la voz. Podés
                                escribir; para hablar, usá Chrome o Edge.
                            </p>
                        )}
                        {teclado && (
                            <EntradaTexto
                                onEnviar={asistente.enviarTexto}
                                deshabilitado={estado === 'pensando'}
                            />
                        )}
                        <ControlesVoz
                            estado={estado}
                            vozSoportada={asistente.vozSoportada}
                            silenciado={asistente.silenciado}
                            tecladoVisible={teclado}
                            onMicrofono={asistente.alternarMicrofono}
                            onDetener={asistente.detenerTodo}
                            onSilencio={asistente.alternarSilencio}
                            onTeclado={() => setTeclado(!teclado)}
                        />
                        <p className="text-center text-[11px] text-white/45">
                            Las respuestas se generan con IA a partir de los
                            registros y pueden contener errores. Verificá las
                            fuentes en la historia clínica.
                        </p>
                    </footer>
                </section>
            </div>
        </>
    );
}

Asistente.layout = {
    breadcrumbs: [
        {
            title: 'Hablar con la IA',
            href: index(),
        },
    ],
};
