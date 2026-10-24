import { CATEGORIAS, TIPOS_EVENTO, etiquetaRubro } from '@/lib/eventos';
import { formatFecha } from '@/lib/format';
import type { FiltrosBusqueda, OrdenBusqueda } from '@/types';

/** Consultas de la demo (CLAUDE.md §5.A). */
export const CONSULTAS_EJEMPLO = [
    'proveedores de obras con multas por atraso desde 2024',
    '¿quién cumplió los plazos pero tuvo problemas de calidad?',
    'proveedores con reclamos repetidos',
    'los mejores proveedores de informática',
];

const ORDEN: Record<OrdenBusqueda, string> = {
    puntaje_asc: 'Menor puntaje primero',
    puntaje_desc: 'Mayor puntaje primero',
    incidencias_desc: 'Más incidencias primero',
};

type Formateador<K extends keyof FiltrosBusqueda> = (
    valor: NonNullable<FiltrosBusqueda[K]>,
) => string | null;

const FORMATEADORES: { [K in keyof FiltrosBusqueda]: Formateador<K> } = {
    texto: (v) => `Texto: “${v}”`,
    nombre: (v) => `Nombre: “${v}”`,
    rubro: (v) => `Rubro: ${etiquetaRubro(v)}`,
    dependencia: (v) => `Dependencia: ${v}`,
    tipos_evento: (v) =>
        v.length
            ? `Eventos: ${v.map((t) => TIPOS_EVENTO[t].etiqueta).join(', ')}`
            : null,
    categoria: (v) => `Categoría: ${CATEGORIAS[v] ?? v}`,
    desde: (v) => `Desde: ${formatFecha(v)}`,
    hasta: (v) => `Hasta: ${formatFecha(v)}`,
    sin_atrasos: (v) => (v ? 'Sin atrasos' : null),
    satisfaccion_max: (v) => `Satisfacción ≤ ${v}/5`,
    puntaje_min: (v) => `Puntaje ≥ ${v}`,
    puntaje_max: (v) => `Puntaje ≤ ${v}`,
    solo_reincidentes: (v) => (v ? 'Solo reincidentes' : null),
    orden: (v) => `Orden: ${ORDEN[v]}`,
    limite: () => null,
};

/** Convierte los filtros aplicados en etiquetas legibles para mostrar como badges. */
export function describirFiltros(filtros: Partial<FiltrosBusqueda>): string[] {
    return (Object.keys(FORMATEADORES) as (keyof FiltrosBusqueda)[]).flatMap(
        (clave) => {
            const valor = filtros[clave];

            if (valor === null || valor === undefined) {
                return [];
            }

            const formatear = FORMATEADORES[clave] as Formateador<typeof clave>;
            const etiqueta = formatear(valor as never);

            return etiqueta ? [etiqueta] : [];
        },
    );
}
