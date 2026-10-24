import { AlarmClockOff, CalendarCheck } from 'lucide-react';
import { FormField, FormSelect } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { diasAtraso } from '@/lib/dictamen';
import { formatDias } from '@/lib/format';
import type { ContratoNuevo, EstadoContrato } from '@/types';

const ESTADOS: { value: EstadoContrato; label: string }[] = [
    { value: 'en_ejecucion', label: 'En ejecución' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'rescindido', label: 'Rescindido' },
];

type Props = {
    contrato: ContratoNuevo;
    onChange: (contrato: ContratoNuevo) => void;
    errores: Record<string, string>;
};

/** Datos del contrato nuevo: identificación, estado, monto y fechas. */
export function ContratoNuevoCampos({ contrato, onChange, errores }: Props) {
    const set = <K extends keyof ContratoNuevo>(
        campo: K,
        valor: ContratoNuevo[K],
    ) => onChange({ ...contrato, [campo]: valor });
    const error = (campo: string) => errores[`contrato_nuevo.${campo}`];
    const cerrado = contrato.estado !== 'en_ejecucion';
    const atraso = cerrado
        ? diasAtraso(contrato.fecha_fin_pactada, contrato.fecha_fin_real)
        : null;

    return (
        <fieldset className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-2 md:col-span-3 lg:grid-cols-4">
            <legend className="px-1 text-xs font-medium">
                Datos del contrato nuevo (sugeridos por la IA)
            </legend>

            <FormField
                id="contrato-codigo"
                label="Código"
                error={error('codigo')}
            >
                <Input
                    id="contrato-codigo"
                    value={contrato.codigo ?? ''}
                    onChange={(e) => set('codigo', e.target.value || null)}
                    placeholder="Ej.: LPN-012/2025"
                    className="bg-card"
                />
            </FormField>
            <FormField
                id="contrato-objeto"
                label="Objeto"
                error={error('objeto')}
                className="sm:col-span-1 lg:col-span-3"
            >
                <Input
                    id="contrato-objeto"
                    value={contrato.objeto}
                    onChange={(e) => set('objeto', e.target.value)}
                    placeholder="Qué se contrató"
                    className="bg-card"
                    aria-invalid={error('objeto') ? true : undefined}
                />
            </FormField>

            <FormField
                id="contrato-estado"
                label="Estado"
                error={error('estado')}
            >
                <FormSelect
                    id="contrato-estado"
                    value={contrato.estado}
                    onChange={(v) => set('estado', v as EstadoContrato)}
                    opciones={ESTADOS}
                />
            </FormField>
            <FormField
                id="contrato-monto"
                label="Monto (Gs.)"
                error={error('monto')}
            >
                <Input
                    id="contrato-monto"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    value={contrato.monto ?? ''}
                    onChange={(e) =>
                        set(
                            'monto',
                            e.target.value === ''
                                ? null
                                : Number(e.target.value),
                        )
                    }
                    placeholder="—"
                    className="bg-card tabular-nums"
                />
            </FormField>
            <FormField
                id="contrato-inicio"
                label="Inicio"
                error={error('fecha_inicio')}
            >
                <Input
                    id="contrato-inicio"
                    type="date"
                    value={contrato.fecha_inicio ?? ''}
                    onChange={(e) =>
                        set('fecha_inicio', e.target.value || null)
                    }
                    className="bg-card"
                />
            </FormField>
            <FormField
                id="contrato-fin-pactada"
                label="Fin pactado"
                error={error('fecha_fin_pactada')}
            >
                <Input
                    id="contrato-fin-pactada"
                    type="date"
                    value={contrato.fecha_fin_pactada ?? ''}
                    onChange={(e) =>
                        set('fecha_fin_pactada', e.target.value || null)
                    }
                    className="bg-card"
                />
            </FormField>

            {cerrado && (
                <>
                    <FormField
                        id="contrato-fin-real"
                        label="Fin real"
                        error={error('fecha_fin_real')}
                    >
                        <Input
                            id="contrato-fin-real"
                            type="date"
                            value={contrato.fecha_fin_real ?? ''}
                            onChange={(e) =>
                                set('fecha_fin_real', e.target.value || null)
                            }
                            className="bg-card"
                        />
                    </FormField>
                    <div className="flex items-end sm:col-span-1 lg:col-span-3">
                        <p
                            className="flex h-9 items-center gap-2 text-sm text-muted-foreground"
                            aria-live="polite"
                        >
                            {atraso === null ? (
                                'El atraso se calcula con el fin pactado y el fin real.'
                            ) : atraso > 0 ? (
                                <span className="flex items-center gap-1.5 font-medium text-crit-foreground">
                                    <AlarmClockOff
                                        className="size-4"
                                        aria-hidden
                                    />
                                    Atraso: {formatDias(atraso)}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 font-medium text-ok-foreground">
                                    <CalendarCheck
                                        className="size-4"
                                        aria-hidden
                                    />
                                    Entregado a tiempo
                                </span>
                            )}
                        </p>
                    </div>
                </>
            )}
        </fieldset>
    );
}
