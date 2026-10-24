import { FormField, FormSelect } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { etiquetaRubro } from '@/lib/eventos';
import { NUEVO } from '@/lib/dictamen';
import type { Destino } from '@/lib/dictamen';
import type { Dependencia, ProveedorOpcion } from '@/types';

type Props = {
    destino: Destino;
    onChange: (destino: Destino) => void;
    proveedores: ProveedorOpcion[];
    dependencias: Dependencia[];
    errores: Record<string, string>;
};

export function DestinoSelector({
    destino,
    onChange,
    proveedores,
    dependencias,
    errores,
}: Props) {
    const set = (cambios: Partial<Destino>) =>
        onChange({ ...destino, ...cambios });
    const proveedor = proveedores.find(
        (p) => String(p.id) === destino.proveedor,
    );
    const esProveedorNuevo = destino.proveedor === NUEVO;
    const esContratoNuevo = destino.contrato === NUEVO || esProveedorNuevo;

    const opcionesProveedor = [
        ...proveedores.map((p) => ({
            value: String(p.id),
            label: `${p.nombre} · ${etiquetaRubro(p.rubro)}`,
        })),
        { value: NUEVO, label: '+ Proveedor nuevo' },
    ];
    const opcionesContrato = [
        ...(proveedor?.contratos ?? []).map((c) => ({
            value: String(c.id),
            label: `${c.codigo ?? 'Sin código'} · ${c.objeto}`,
        })),
        { value: NUEVO, label: '+ Contrato nuevo' },
    ];
    const opcionesDependencia = dependencias.map((d) => ({
        value: String(d.id),
        label: d.sigla ? `${d.nombre} (${d.sigla})` : d.nombre,
    }));

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <FormField
                id="destino-proveedor"
                label="Proveedor"
                error={errores.proveedor_id}
            >
                <FormSelect
                    id="destino-proveedor"
                    value={destino.proveedor}
                    onChange={(v) =>
                        set({
                            proveedor: v,
                            contrato: v === NUEVO ? NUEVO : '',
                        })
                    }
                    opciones={opcionesProveedor}
                    placeholder="Elegí el proveedor"
                    invalid={!!errores.proveedor_id}
                />
            </FormField>
            <FormField
                id="destino-contrato"
                label="Contrato"
                error={errores.contrato_id}
            >
                <FormSelect
                    id="destino-contrato"
                    value={esProveedorNuevo ? NUEVO : destino.contrato}
                    onChange={(v) => set({ contrato: v })}
                    opciones={
                        esProveedorNuevo
                            ? [{ value: NUEVO, label: '+ Contrato nuevo' }]
                            : opcionesContrato
                    }
                    placeholder={
                        destino.proveedor
                            ? 'Elegí el contrato'
                            : 'Primero elegí el proveedor'
                    }
                    invalid={!!errores.contrato_id}
                />
            </FormField>
            <FormField
                id="destino-dependencia"
                label="Dependencia solicitante"
                error={errores.dependencia_id}
            >
                <FormSelect
                    id="destino-dependencia"
                    value={destino.dependencia}
                    onChange={(v) => set({ dependencia: v })}
                    opciones={opcionesDependencia}
                    placeholder="Elegí la dependencia"
                    invalid={!!errores.dependencia_id}
                />
            </FormField>

            {esProveedorNuevo && (
                <fieldset className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-2 md:col-span-3">
                    <legend className="px-1 text-xs font-medium">
                        Datos del proveedor nuevo
                    </legend>
                    <FormField
                        id="nuevo-nombre"
                        label="Nombre"
                        error={errores['proveedor_nuevo.nombre']}
                    >
                        <Input
                            id="nuevo-nombre"
                            value={destino.proveedorNuevo.nombre}
                            onChange={(e) =>
                                set({
                                    proveedorNuevo: {
                                        ...destino.proveedorNuevo,
                                        nombre: e.target.value,
                                    },
                                })
                            }
                            className="bg-card"
                        />
                    </FormField>
                    <FormField
                        id="nuevo-rubro"
                        label="Rubro"
                        error={errores['proveedor_nuevo.rubro']}
                    >
                        <Input
                            id="nuevo-rubro"
                            value={destino.proveedorNuevo.rubro}
                            onChange={(e) =>
                                set({
                                    proveedorNuevo: {
                                        ...destino.proveedorNuevo,
                                        rubro: e.target.value,
                                    },
                                })
                            }
                            placeholder="Ej.: obras"
                            className="bg-card"
                        />
                    </FormField>
                </fieldset>
            )}

            {esContratoNuevo && (
                <fieldset className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-[180px_minmax(0,1fr)] md:col-span-3">
                    <legend className="px-1 text-xs font-medium">
                        Datos del contrato nuevo (sugeridos por la IA)
                    </legend>
                    <FormField
                        id="contrato-codigo"
                        label="Código"
                        error={errores['contrato_nuevo.codigo']}
                    >
                        <Input
                            id="contrato-codigo"
                            value={destino.contratoNuevo.codigo ?? ''}
                            onChange={(e) =>
                                set({
                                    contratoNuevo: {
                                        ...destino.contratoNuevo,
                                        codigo: e.target.value || null,
                                    },
                                })
                            }
                            className="bg-card"
                        />
                    </FormField>
                    <FormField
                        id="contrato-objeto"
                        label="Objeto"
                        error={errores['contrato_nuevo.objeto']}
                    >
                        <Input
                            id="contrato-objeto"
                            value={destino.contratoNuevo.objeto}
                            onChange={(e) =>
                                set({
                                    contratoNuevo: {
                                        ...destino.contratoNuevo,
                                        objeto: e.target.value,
                                    },
                                })
                            }
                            className="bg-card"
                        />
                    </FormField>
                </fieldset>
            )}
        </div>
    );
}
