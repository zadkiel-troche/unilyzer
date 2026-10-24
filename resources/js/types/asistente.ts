import type { ModoBusqueda, ProveedorRanking } from './proveedores';

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

export type AsistenteRespuesta = {
    modo: ModoBusqueda;
    respuesta: string;
    proveedores: ProveedorRanking[];
    eventos_citados: number[];
};
