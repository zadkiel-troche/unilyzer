import { Quote, Trash2 } from 'lucide-react';
import { FormField, FormSelect } from '@/components/form-field';
import { OrigenBadge } from '@/components/origen-badge';
import { EventoIcon } from '@/components/proveedores/evento-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIAS, LISTA_TIPOS_EVENTO, TIPOS_EVENTO } from '@/lib/eventos';
import type { EventoBorrador } from '@/lib/dictamen';
import type { EventoExtraido, TipoEvento } from '@/types';

const SIN_CATEGORIA = 'ninguna';

const OPCIONES_TIPO = LISTA_TIPOS_EVENTO.map((t) => ({
    value: t,
    label: TIPOS_EVENTO[t].etiqueta,
}));
const OPCIONES_CATEGORIA = [
    { value: SIN_CATEGORIA, label: 'Sin categoría' },
    ...Object.entries(CATEGORIAS).map(([value, label]) => ({ value, label })),
];

type Props = {
    indice: number;
    evento: EventoBorrador;
    errores: Partial<Record<keyof EventoExtraido, string>>;
    onChange: (evento: EventoBorrador) => void;
    onQuitar: () => void;
};

const aNumero = (valor: string): number | null =>
    valor === '' ? null : Number(valor);

export function EventoEditor({
    indice,
    evento,
    errores,
    onChange,
    onQuitar,
}: Props) {
    const id = (campo: string) => `evento-${indice}-${campo}`;
    const set = <K extends keyof EventoExtraido>(
        campo: K,
        valor: EventoExtraido[K],
    ) => onChange({ ...evento, [campo]: valor });

    return (
        <li className="rounded-xl border bg-card p-4">
            <div className="mb-4 flex items-center gap-3">
                <EventoIcon tipo={evento.tipo} />
                <h3 className="flex-1 text-sm font-semibold">
                    Evento {indice + 1}: {TIPOS_EVENTO[evento.tipo].etiqueta}
                </h3>
                {evento.extraido_por_ia ? (
                    <OrigenBadge origen="ia" etiqueta="Extraído por IA" />
                ) : (
                    <OrigenBadge
                        origen="registrado"
                        etiqueta="Agregado a mano"
                    />
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onQuitar}
                    className="text-muted-foreground hover:text-crit-foreground"
                >
                    <Trash2 />
                    Quitar
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField id={id('tipo')} label="Tipo" error={errores.tipo}>
                    <FormSelect
                        id={id('tipo')}
                        value={evento.tipo}
                        onChange={(v) => set('tipo', v as TipoEvento)}
                        opciones={OPCIONES_TIPO}
                    />
                </FormField>
                <FormField
                    id={id('categoria')}
                    label="Categoría"
                    error={errores.categoria}
                >
                    <FormSelect
                        id={id('categoria')}
                        value={evento.categoria ?? SIN_CATEGORIA}
                        onChange={(v) =>
                            set('categoria', v === SIN_CATEGORIA ? null : v)
                        }
                        opciones={OPCIONES_CATEGORIA}
                    />
                </FormField>
                <FormField id={id('fecha')} label="Fecha" error={errores.fecha}>
                    <Input
                        id={id('fecha')}
                        type="date"
                        value={evento.fecha ?? ''}
                        onChange={(e) => set('fecha', e.target.value || null)}
                        className="bg-card"
                    />
                </FormField>
                <FormField id={id('dias')} label="Días" error={errores.dias}>
                    <Input
                        id={id('dias')}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={evento.dias ?? ''}
                        onChange={(e) => set('dias', aNumero(e.target.value))}
                        placeholder="—"
                        className="bg-card"
                    />
                </FormField>
                <FormField
                    id={id('descripcion')}
                    label="Descripción"
                    error={errores.descripcion}
                    className="sm:col-span-2 lg:col-span-4"
                >
                    <Textarea
                        id={id('descripcion')}
                        value={evento.descripcion}
                        onChange={(e) => set('descripcion', e.target.value)}
                        className="min-h-12 bg-card"
                        aria-invalid={errores.descripcion ? true : undefined}
                    />
                </FormField>
                <FormField
                    id={id('extracto')}
                    label={
                        evento.extraido_por_ia
                            ? 'Extracto del documento (cita textual)'
                            : 'Extracto del documento (opcional)'
                    }
                    error={errores.extracto_fuente}
                    className="sm:col-span-2 lg:col-span-4"
                >
                    <div className="relative">
                        <Quote
                            className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-muted-foreground"
                            aria-hidden
                        />
                        <Textarea
                            id={id('extracto')}
                            value={evento.extracto_fuente ?? ''}
                            onChange={(e) =>
                                set('extracto_fuente', e.target.value || null)
                            }
                            className="min-h-12 border-l-2 border-l-brand-teal bg-muted/50 pl-8 italic"
                        />
                    </div>
                </FormField>
            </div>
        </li>
    );
}
