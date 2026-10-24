import { Info } from 'lucide-react';

/** Aviso cuando la IA no está disponible y se buscó por palabras clave. */
export function ModoAviso() {
    return (
        <div
            role="status"
            className="flex gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn-foreground"
        >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
                <span className="font-semibold">
                    Búsqueda por palabras clave.
                </span>{' '}
                La IA no está disponible en este momento, así que se buscaron
                coincidencias literales en nombres, rubros, contratos y eventos.
                Los resultados pueden ser menos precisos.
            </p>
        </div>
    );
}
