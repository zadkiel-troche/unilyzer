import { ArrowRight, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CONSULTAS_EJEMPLO } from '@/lib/busqueda';
import { cn } from '@/lib/utils';

type Props = {
    onBuscar: (q: string) => void;
    valorInicial?: string;
    cargando?: boolean;
    mostrarEjemplos?: boolean;
    autoFocus?: boolean;
    /** `sobreOscuro` adapta los chips de ejemplo a un fondo navy. */
    sobreOscuro?: boolean;
    className?: string;
};

/** Buscador en lenguaje natural. Atajo: ⌘K / Ctrl+K para enfocarlo. */
export function BusquedaInput({
    onBuscar,
    valorInicial = '',
    cargando = false,
    mostrarEjemplos = true,
    autoFocus = false,
    sobreOscuro = false,
    className,
}: Props) {
    const [q, setQ] = useState(valorInicial);
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const alPresionar = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                input.current?.focus();
            }
        };

        window.addEventListener('keydown', alPresionar);

        return () => window.removeEventListener('keydown', alPresionar);
    }, []);

    const enviar = (consulta: string) => {
        const limpia = consulta.trim();

        if (limpia) {
            onBuscar(limpia);
        }
    };

    const alEnviar = (e: FormEvent) => {
        e.preventDefault();
        enviar(q);
    };

    const usarEjemplo = (ejemplo: string) => {
        setQ(ejemplo);
        enviar(ejemplo);
    };

    return (
        <div className={cn('space-y-3', className)}>
            <form role="search" onSubmit={alEnviar} className="relative">
                <label htmlFor="busqueda" className="sr-only">
                    Preguntá por un proveedor en lenguaje natural
                </label>
                <Search
                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <input
                    ref={input}
                    id="busqueda"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    placeholder="Ej.: ¿quién cumplió los plazos pero tuvo problemas de calidad?"
                    className="h-14 w-full rounded-xl border border-input bg-card pr-32 pl-12 text-base shadow-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
                <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2">
                    <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground md:inline">
                        ⌘K
                    </kbd>
                    <Button
                        type="submit"
                        disabled={cargando || !q.trim()}
                        className="h-10"
                    >
                        {cargando ? <Spinner /> : <ArrowRight />}
                        <span className="hidden sm:inline">Buscar</span>
                    </Button>
                </div>
            </form>

            {mostrarEjemplos && (
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={cn(
                            'text-xs',
                            sobreOscuro
                                ? 'text-white/70'
                                : 'text-muted-foreground',
                        )}
                    >
                        Probá con:
                    </span>
                    {CONSULTAS_EJEMPLO.map((ejemplo) => (
                        <button
                            key={ejemplo}
                            type="button"
                            onClick={() => usarEjemplo(ejemplo)}
                            disabled={cargando}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50',
                                sobreOscuro
                                    ? 'border-white/15 bg-white/5 text-white hover:border-brand-teal/60 hover:bg-white/10'
                                    : 'bg-card text-foreground hover:border-brand-action/50 hover:bg-accent',
                            )}
                        >
                            {ejemplo}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
