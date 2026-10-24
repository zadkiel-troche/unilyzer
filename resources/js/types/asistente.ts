import type {
    EstadoContrato,
    ModoBusqueda,
    ProveedorRanking,
} from './proveedores';

/**
 * Contrato de POST /asistente (pendiente de agregar a CLAUDE.md).
 * El backend (AsistenteService) responde con texto apto para leer en voz
 * alta: frases cortas, sin ids ni markdown. Las fuentes van aparte.
 */
export type RolMensaje = 'usuario' | 'asistente';

export type MensajeHistorial = {
    rol: RolMensaje;
    texto: string;
};

export type AsistenteSolicitud = {
    mensaje: string;
    /** Últimos turnos de la conversación, del más viejo al más nuevo. */
    historial: MensajeHistorial[];
};

/** Fila de estadísticas de una dependencia (EstadisticasService). */
export type DependenciaEstadistica = {
    id: number;
    nombre: string;
    sigla: string | null;
    contratos: number;
    proveedores: number;
    monto_total: number;
    por_estado: Record<EstadoContrato, number>;
};

export type AsistenteRespuesta = {
    modo: ModoBusqueda;
    respuesta: string;
    proveedores: ProveedorRanking[];
    /** Dependencias mencionadas en preguntas de conteo, en el orden en que se nombran. */
    dependencias: DependenciaEstadistica[];
    eventos_citados: number[];
};
