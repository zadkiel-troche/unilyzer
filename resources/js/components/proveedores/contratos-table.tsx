import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDias, formatFecha, formatMonto, formatNota } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Contrato, EstadoContrato } from '@/types';

const ESTADOS: Record<EstadoContrato, { etiqueta: string; clase: string }> = {
    en_ejecucion: {
        etiqueta: 'En ejecución',
        clase: 'bg-accent text-accent-foreground',
    },
    finalizado: {
        etiqueta: 'Finalizado',
        clase: 'bg-secondary text-secondary-foreground',
    },
    rescindido: {
        etiqueta: 'Rescindido',
        clase: 'bg-crit-soft text-crit-foreground',
    },
};

function promedio(valores: number[]): number | null {
    return valores.length
        ? valores.reduce((a, b) => a + b, 0) / valores.length
        : null;
}

export function ContratosTable({ contratos }: { contratos: Contrato[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Fin pactado</TableHead>
                    <TableHead>Fin real</TableHead>
                    <TableHead className="text-right">Atraso</TableHead>
                    <TableHead className="text-right">Calidad</TableHead>
                    <TableHead className="text-right">Satisfacción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {contratos.map((c) => {
                    const estado = ESTADOS[c.estado];

                    return (
                        <TableRow key={c.id}>
                            <TableCell className="max-w-72">
                                <div className="font-mono text-xs text-muted-foreground">
                                    {c.codigo ?? 'Sin código'}
                                </div>
                                <div
                                    className="truncate font-medium"
                                    title={c.objeto}
                                >
                                    {c.objeto}
                                </div>
                                {c.dependencia && (
                                    <div className="text-xs text-muted-foreground">
                                        {c.dependencia.nombre}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'border-transparent',
                                        estado.clase,
                                    )}
                                >
                                    {estado.etiqueta}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap tabular-nums">
                                {formatMonto(c.monto)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {formatFecha(c.fecha_fin_pactada)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {formatFecha(c.fecha_fin_real)}
                            </TableCell>
                            <TableCell
                                className={cn(
                                    'text-right whitespace-nowrap tabular-nums',
                                    c.dias_atraso > 0 &&
                                        'font-medium text-crit-foreground',
                                )}
                            >
                                {c.dias_atraso > 0
                                    ? formatDias(c.dias_atraso)
                                    : c.fecha_fin_real
                                      ? 'A tiempo'
                                      : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {formatNota(
                                    promedio(
                                        c.evaluaciones.map((e) => e.calidad),
                                    ),
                                )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {formatNota(
                                    promedio(
                                        c.evaluaciones.map(
                                            (e) => e.satisfaccion,
                                        ),
                                    ),
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
