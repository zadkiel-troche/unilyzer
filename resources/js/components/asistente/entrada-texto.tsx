import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

type Props = {
    onEnviar: (texto: string) => void;
    deshabilitado: boolean;
};

export function EntradaTexto({ onEnviar, deshabilitado }: Props) {
    const [texto, setTexto] = useState('');

    const enviar = (e: FormEvent) => {
        e.preventDefault();
        const limpio = texto.trim();

        if (limpio) {
            onEnviar(limpio);
            setTexto('');
        }
    };

    return (
        <form
            onSubmit={enviar}
            className="flex w-full max-w-xl animate-in items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 pl-5 backdrop-blur duration-300 fade-in slide-in-from-bottom-2"
        >
            <label htmlFor="asistente-texto" className="sr-only">
                Escribí tu pregunta
            </label>
            <input
                id="asistente-texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="Escribí tu pregunta…"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
                type="submit"
                disabled={deshabilitado || !texto.trim()}
                aria-label="Enviar"
                className="grid size-9 place-items-center rounded-full bg-white text-neutral-950 transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-brand-teal/50 focus-visible:outline-none disabled:opacity-40"
            >
                <ArrowUp className="size-4" />
            </button>
        </form>
    );
}
