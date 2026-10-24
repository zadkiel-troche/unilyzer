import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export type OpcionCombobox = {
    value: string;
    label: string;
    /** Texto secundario debajo de la etiqueta (también se busca en él). */
    detalle?: string;
};

type Props = {
    id: string;
    value: string;
    /** `consulta` es lo que había escrito el usuario (útil para "crear nuevo"). */
    onChange: (value: string, consulta: string) => void;
    opciones: OpcionCombobox[];
    /** Opción fija al final que nunca se filtra, p. ej. "+ Proveedor nuevo". */
    accion?: OpcionCombobox;
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
};

const normalizar = (texto: string) =>
    texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

function coincide(opcion: OpcionCombobox, consulta: string): boolean {
    const texto = normalizar(`${opcion.label} ${opcion.detalle ?? ''}`);

    return normalizar(consulta)
        .split(/\s+/)
        .every((palabra) => texto.includes(palabra));
}

/**
 * Select con buscador (patrón ARIA combobox). Se escribe para filtrar, se
 * navega con ↑ ↓, Enter elige y Escape cierra. Sin dependencias.
 */
export function Combobox({
    id,
    value,
    onChange,
    opciones,
    accion,
    placeholder = 'Buscar…',
    invalid,
    disabled,
}: Props) {
    const [abierto, setAbierto] = useState(false);
    const [consulta, setConsulta] = useState('');
    const [activo, setActivo] = useState(0);
    const listaId = useId();

    const seleccionada = [...opciones, ...(accion ? [accion] : [])].find(
        (o) => o.value === value,
    );
    const filtradas = consulta
        ? opciones.filter((o) => coincide(o, consulta))
        : opciones;
    const visibles = accion ? [...filtradas, accion] : filtradas;
    const idOpcion = (i: number) => `${listaId}-${i}`;

    const abrir = () => {
        if (disabled) {
            return;
        }

        setConsulta('');
        setActivo(
            Math.max(
                0,
                visibles.findIndex((o) => o.value === value),
            ),
        );
        setAbierto(true);
    };

    const elegir = (opcion: OpcionCombobox) => {
        onChange(opcion.value, consulta.trim());
        setAbierto(false);
        setConsulta('');
    };

    const moverA = (i: number) => {
        setActivo(i);
        document
            .getElementById(idOpcion(i))
            ?.scrollIntoView({ block: 'nearest' });
    };

    const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!abierto && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            e.preventDefault();
            abrir();

            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moverA(Math.min(visibles.length - 1, activo + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moverA(Math.max(0, activo - 1));
        } else if (e.key === 'Enter' && visibles[activo]) {
            e.preventDefault();
            elegir(visibles[activo]);
        } else if (e.key === 'Escape') {
            setAbierto(false);
        }
    };

    return (
        <div className="relative">
            {abierto ? (
                <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
            ) : null}
            <input
                id={id}
                role="combobox"
                aria-expanded={abierto}
                aria-controls={listaId}
                aria-autocomplete="list"
                aria-activedescendant={
                    abierto && visibles[activo] ? idOpcion(activo) : undefined
                }
                aria-invalid={invalid || undefined}
                disabled={disabled}
                autoComplete="off"
                value={abierto ? consulta : (seleccionada?.label ?? '')}
                placeholder={
                    abierto ? (seleccionada?.label ?? placeholder) : placeholder
                }
                onChange={(e) => {
                    setConsulta(e.target.value);
                    setActivo(0);
                    setAbierto(true);
                }}
                onFocus={abrir}
                onClick={() => !abierto && abrir()}
                onBlur={() => setAbierto(false)}
                onKeyDown={alTeclear}
                className={cn(
                    'flex h-9 w-full min-w-0 truncate rounded-md border border-input bg-card py-1 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
                    abierto ? 'pl-9' : 'pl-3',
                )}
            />
            <ChevronsUpDown
                className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
            />

            {abierto && (
                <ul
                    id={listaId}
                    role="listbox"
                    // Evita que el input pierda el foco antes del click.
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute z-50 mt-1 max-h-72 w-full min-w-64 animate-in overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg duration-150 fade-in-0 zoom-in-95"
                >
                    {filtradas.length === 0 && (
                        <li
                            className="px-2 py-2 text-sm text-muted-foreground"
                            role="presentation"
                        >
                            Sin resultados para “{consulta}”
                        </li>
                    )}
                    {visibles.map((opcion, i) => {
                        const esAccion = opcion === accion;

                        return (
                            <li
                                key={opcion.value}
                                id={idOpcion(i)}
                                role="option"
                                aria-selected={opcion.value === value}
                                onClick={() => elegir(opcion)}
                                onMouseMove={() => i !== activo && setActivo(i)}
                                className={cn(
                                    'flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm',
                                    i === activo &&
                                        'bg-accent text-accent-foreground',
                                    esAccion &&
                                        'mt-1 border-t pt-2 font-medium text-brand',
                                )}
                            >
                                {esAccion ? (
                                    <Plus
                                        className="mt-0.5 size-4 shrink-0"
                                        aria-hidden
                                    />
                                ) : (
                                    <Check
                                        className={cn(
                                            'mt-0.5 size-4 shrink-0',
                                            opcion.value !== value &&
                                                'invisible',
                                        )}
                                        aria-hidden
                                    />
                                )}
                                <span className="min-w-0">
                                    <span className="block">
                                        {esAccion && consulta.trim()
                                            ? `${opcion.label}: “${consulta.trim()}”`
                                            : opcion.label}
                                    </span>
                                    {opcion.detalle && (
                                        <span className="block text-xs text-muted-foreground">
                                            {opcion.detalle}
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
