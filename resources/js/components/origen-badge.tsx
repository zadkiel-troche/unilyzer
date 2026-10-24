import { Calculator, Database, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type Origen = 'registrado' | 'calculado' | 'ia';

const ORIGENES = {
    registrado: {
        etiqueta: 'Registrado',
        ayuda: 'Dato cargado a partir de un documento o registro institucional.',
        icono: Database,
        clase: 'bg-secondary text-secondary-foreground',
    },
    calculado: {
        etiqueta: 'Calculado',
        ayuda: 'Resultado de una fórmula explicable sobre los registros.',
        icono: Calculator,
        clase: 'bg-accent text-accent-foreground',
    },
    ia: {
        etiqueta: 'Generado por IA',
        ayuda: 'Interpretación automática: puede contener errores. Verificá la fuente citada.',
        icono: Sparkles,
        clase: 'bg-ai-soft text-ai border-ai/20',
    },
} as const;

/** Distingue datos registrados, conclusiones calculadas e inferencias de IA. */
export function OrigenBadge({
    origen,
    etiqueta: etiquetaPropia,
    className,
}: {
    origen: Origen;
    /** Reemplaza el texto por defecto, p. ej. "Extraído por IA". */
    etiqueta?: string;
    className?: string;
}) {
    const { etiqueta, ayuda, icono: Icono, clase } = ORIGENES[origen];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant="outline"
                    className={cn(
                        'cursor-help border-transparent',
                        clase,
                        className,
                    )}
                    tabIndex={0}
                >
                    <Icono aria-hidden />
                    {etiquetaPropia ?? etiqueta}
                </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-60">{ayuda}</TooltipContent>
        </Tooltip>
    );
}
