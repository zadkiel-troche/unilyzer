import { FormField, FormSelect } from '@/components/form-field';
import { Textarea } from '@/components/ui/textarea';
import type { Destino } from '@/lib/dictamen';

const NOTAS = [
    { value: '5', label: '5 · Excelente' },
    { value: '4', label: '4 · Buena' },
    { value: '3', label: '3 · Aceptable' },
    { value: '2', label: '2 · Deficiente' },
    { value: '1', label: '1 · Muy deficiente' },
];

type Evaluacion = Destino['evaluacion'];

type Props = {
    evaluacion: Evaluacion;
    onChange: (evaluacion: Evaluacion) => void;
    errores: Record<string, string>;
};

/** Evaluación opcional de la dependencia: alimenta el componente "calidad" del puntaje. */
export function EvaluacionCampos({ evaluacion, onChange, errores }: Props) {
    const set = (cambios: Partial<Evaluacion>) =>
        onChange({ ...evaluacion, ...cambios });
    const incompleta =
        (evaluacion.calidad === '') !== (evaluacion.satisfaccion === '');

    return (
        <fieldset className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-2 md:col-span-3 lg:grid-cols-4">
            <legend className="px-1 text-xs font-medium">
                Evaluación de la dependencia (opcional)
            </legend>

            <FormField
                id="evaluacion-calidad"
                label="Calidad"
                error={errores['evaluacion.calidad']}
            >
                <FormSelect
                    id="evaluacion-calidad"
                    value={evaluacion.calidad}
                    onChange={(v) => set({ calidad: v })}
                    opciones={NOTAS}
                    placeholder="Sin calificar"
                />
            </FormField>
            <FormField
                id="evaluacion-satisfaccion"
                label="Satisfacción"
                error={errores['evaluacion.satisfaccion']}
            >
                <FormSelect
                    id="evaluacion-satisfaccion"
                    value={evaluacion.satisfaccion}
                    onChange={(v) => set({ satisfaccion: v })}
                    opciones={NOTAS}
                    placeholder="Sin calificar"
                />
            </FormField>
            <FormField
                id="evaluacion-comentario"
                label="Comentario"
                error={errores['evaluacion.comentario']}
                className="sm:col-span-2"
            >
                <Textarea
                    id="evaluacion-comentario"
                    value={evaluacion.comentario}
                    onChange={(e) => set({ comentario: e.target.value })}
                    placeholder="Ej.: entregó a tiempo, pero los materiales no cumplen el pliego"
                    className="min-h-9 bg-card"
                />
            </FormField>
            <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
                {incompleta
                    ? 'Completá calidad y satisfacción para que se guarde la evaluación.'
                    : 'Se usa en el componente "Calidad" del puntaje (35 %).'}
            </p>
        </fieldset>
    );
}
