import type { LucideIcon } from 'lucide-react';
import {
    AlarmClockOff,
    ArrowRightLeft,
    BadgeCheck,
    Ban,
    CalendarPlus,
    ClipboardX,
    Gavel,
    MessageSquareWarning,
    TrendingUp,
} from 'lucide-react';
import type { TipoEvento } from '@/types';

type TipoEventoInfo = {
    etiqueta: string;
    plural: string;
    icono: LucideIcon;
    /** Cuenta como incidencia en el puntaje (CLAUDE.md §3). */
    negativo: boolean;
};

export const TIPOS_EVENTO: Record<TipoEvento, TipoEventoInfo> = {
    atraso: {
        etiqueta: 'Atraso',
        plural: 'Atrasos',
        icono: AlarmClockOff,
        negativo: true,
    },
    multa: {
        etiqueta: 'Multa',
        plural: 'Multas',
        icono: Gavel,
        negativo: true,
    },
    reclamo: {
        etiqueta: 'Reclamo',
        plural: 'Reclamos',
        icono: MessageSquareWarning,
        negativo: true,
    },
    observacion_tecnica: {
        etiqueta: 'Observación técnica',
        plural: 'Observaciones técnicas',
        icono: ClipboardX,
        negativo: true,
    },
    terminacion: {
        etiqueta: 'Terminación',
        plural: 'Terminaciones',
        icono: Ban,
        negativo: true,
    },
    prorroga: {
        etiqueta: 'Prórroga',
        plural: 'Prórrogas',
        icono: CalendarPlus,
        negativo: false,
    },
    ampliacion: {
        etiqueta: 'Ampliación',
        plural: 'Ampliaciones',
        icono: TrendingUp,
        negativo: false,
    },
    cambio_administrativo: {
        etiqueta: 'Cambio administrativo',
        plural: 'Cambios administrativos',
        icono: ArrowRightLeft,
        negativo: false,
    },
    recepcion_conforme: {
        etiqueta: 'Recepción conforme',
        plural: 'Recepciones conformes',
        icono: BadgeCheck,
        negativo: false,
    },
};

export const LISTA_TIPOS_EVENTO = Object.keys(TIPOS_EVENTO) as TipoEvento[];

export const CATEGORIAS: Record<string, string> = {
    plazo: 'Plazo',
    calidad: 'Calidad',
    materiales: 'Materiales',
    documentacion: 'Documentación',
    seguridad: 'Seguridad',
    atencion: 'Atención',
    clima: 'Clima',
};

export function etiquetaCategoria(categoria: string | null): string | null {
    return categoria ? (CATEGORIAS[categoria] ?? categoria) : null;
}

const RUBROS: Record<string, string> = {
    obras: 'Obras',
    informatica: 'Informática',
    limpieza: 'Limpieza',
    mobiliario: 'Mobiliario',
    insumos_laboratorio: 'Insumos de laboratorio',
    seguridad: 'Seguridad',
    mantenimiento_electrico: 'Mantenimiento eléctrico',
    alimentos: 'Alimentos',
};

export function etiquetaRubro(rubro: string): string {
    return RUBROS[rubro] ?? rubro.replaceAll('_', ' ');
}
