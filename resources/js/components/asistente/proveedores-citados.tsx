import { Link } from '@inertiajs/react';
import { ScoreRing } from '@/components/proveedores/score-ring';
import { show } from '@/routes/proveedores';
import type { ProveedorRanking } from '@/types';

/** Fuentes de la respuesta: los proveedores mencionados, con link a su historia clínica. */
export function ProveedoresCitados({
    proveedores,
}: {
    proveedores: ProveedorRanking[];
}) {
    if (proveedores.length === 0) {
        return null;
    }

    return (
        <ul
            className="flex flex-wrap justify-center gap-2"
            aria-label="Proveedores mencionados"
        >
            {proveedores.map((p, i) => (
                <li
                    key={p.id}
                    className="animate-in fill-mode-both fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${i * 120}ms` }}
                >
                    <Link
                        href={show(p.id)}
                        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-4 pl-1 text-sm text-white backdrop-blur transition-colors hover:border-brand-teal/60 hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-brand-teal/50 focus-visible:outline-none"
                    >
                        <ScoreRing
                            puntaje={p.puntaje}
                            nivel={p.semaforo.nivel}
                            size="sm"
                            className="size-8 [&_.stroke-muted]:stroke-white/15 [&_span]:text-[11px]"
                        />
                        <span className="font-medium">{p.nombre}</span>
                        <span className="text-xs text-white/60">
                            {p.semaforo.etiqueta}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
