import { formatNumero } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DependenciaEstadistica } from '@/types';

type Props = {
    dependencias: DependenciaEstadistica[];
    /** Sobre el escenario negro del asistente o sobre una superficie normal. */
    sobreOscuro?: boolean;
};

/** Tabla compacta con los números que respaldan una respuesta de conteo. */
export function DependenciasCitadas({
    dependencias,
    sobreOscuro = true,
}: Props) {
    if (dependencias.length === 0) {
        return null;
    }

    const atenuado = sobreOscuro ? 'text-white/55' : 'text-muted-foreground';

    return (
        <div
            className={cn(
                'w-full max-w-xl animate-in overflow-x-auto rounded-xl border text-sm duration-500 fade-in slide-in-from-bottom-2',
                sobreOscuro
                    ? 'border-white/10 bg-white/[0.04] text-white backdrop-blur'
                    : 'bg-card',
            )}
        >
            <table className="w-full">
                <caption className="sr-only">
                    Contratos y proveedores por dependencia
                </caption>
                <thead>
                    <tr
                        className={cn(
                            'text-[10px] font-semibold tracking-[0.08em] uppercase',
                            atenuado,
                        )}
                    >
                        <th scope="col" className="px-3 py-2 text-left">
                            Dependencia
                        </th>
                        <th scope="col" className="px-3 py-2 text-right">
                            Contratos
                        </th>
                        <th scope="col" className="px-3 py-2 text-right">
                            Proveedores
                        </th>
                        <th
                            scope="col"
                            className="hidden px-3 py-2 text-right sm:table-cell"
                        >
                            Ejecución · Fin. · Resc.
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {dependencias.map((d) => (
                        <tr
                            key={d.id}
                            className={cn(
                                'border-t',
                                sobreOscuro && 'border-white/10',
                            )}
                        >
                            <th
                                scope="row"
                                className="px-3 py-2 text-left font-medium"
                            >
                                {d.nombre}
                                {d.sigla && (
                                    <span
                                        className={cn(
                                            'ml-1.5 text-xs font-normal',
                                            atenuado,
                                        )}
                                    >
                                        {d.sigla}
                                    </span>
                                )}
                                {d.lista_proveedores.length > 0 && (
                                    <span
                                        className={cn(
                                            'mt-0.5 block text-xs font-normal text-pretty',
                                            atenuado,
                                        )}
                                    >
                                        {d.lista_proveedores
                                            .map((p) => p.nombre)
                                            .join(' · ')}
                                    </span>
                                )}
                            </th>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                {formatNumero(d.contratos)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                                {formatNumero(d.proveedores)}
                            </td>
                            <td
                                className={cn(
                                    'hidden px-3 py-2 text-right tabular-nums sm:table-cell',
                                    atenuado,
                                )}
                            >
                                {d.por_estado.en_ejecucion} ·{' '}
                                {d.por_estado.finalizado} ·{' '}
                                {d.por_estado.rescindido}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
