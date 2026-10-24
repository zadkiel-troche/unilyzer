import type {
    CargarDictamenProps,
    ConfirmarDictamenPayload,
    ContratoExtraido,
    ContratoNuevo,
    EventoExtraido,
    ExtraccionDictamen,
} from '@/types';

/** Evento en revisión: lo propuso la IA o lo agregó el usuario a mano. */
export type EventoBorrador = EventoExtraido & {
    /** Identificador local estable para React (no se envía). */
    clave: string;
    extraido_por_ia: boolean;
};

let siguienteClave = 0;
const nuevaClave = () => `evento-${++siguienteClave}`;

export function desdeExtraccion(eventos: EventoExtraido[]): EventoBorrador[] {
    return eventos.map((e) => ({
        ...e,
        clave: nuevaClave(),
        extraido_por_ia: true,
    }));
}

/** Evento en blanco para cargar a mano lo que la IA no detectó. */
export function eventoManual(): EventoBorrador {
    return {
        clave: nuevaClave(),
        extraido_por_ia: false,
        tipo: 'observacion_tecnica',
        fecha: null,
        dias: null,
        monto: null,
        categoria: null,
        descripcion: '',
        extracto_fuente: null,
    };
}

/** Valor de los selects para "crear uno nuevo". */
export const NUEVO = 'nuevo';

/** Selección del usuario en el paso "¿A qué historial pertenece?". */
export type Destino = {
    proveedor: string;
    proveedorNuevo: { nombre: string; rubro: string };
    contrato: string;
    contratoNuevo: ContratoNuevo;
    dependencia: string;
    /** Notas como texto ("" = sin calificar) para los selects. */
    evaluacion: { calidad: string; satisfaccion: string; comentario: string };
};

const EVALUACION_VACIA = { calidad: '', satisfaccion: '', comentario: '' };

/** Completa lo extraído por la IA con los campos que solo carga la persona. */
const completarContrato = (contrato: ContratoExtraido): ContratoNuevo => ({
    ...contrato,
    estado: 'en_ejecucion',
    fecha_fin_real: null,
});

/** Días de atraso que resultan de las fechas cargadas (igual que Contrato::diasAtraso). */
export function diasAtraso(
    pactada: string | null,
    real: string | null,
): number | null {
    if (!pactada || !real) {
        return null;
    }

    const dias =
        (Date.parse(`${real}T00:00:00Z`) - Date.parse(`${pactada}T00:00:00Z`)) /
        86_400_000;

    return Number.isNaN(dias) ? null : Math.max(0, Math.round(dias));
}

const normalizar = (texto: string) =>
    texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

/** Destino en blanco para cargar eventos a mano, sin análisis de IA. */
export function destinoVacio(): Destino {
    return {
        proveedor: '',
        proveedorNuevo: { nombre: '', rubro: '' },
        contrato: '',
        contratoNuevo: completarContrato({
            codigo: null,
            objeto: '',
            monto: null,
            fecha_inicio: null,
            fecha_fin_pactada: null,
        }),
        dependencia: '',
        evaluacion: EVALUACION_VACIA,
    };
}

/** Preselecciona proveedor, contrato y dependencia a partir de lo que detectó la IA. */
export function destinoSugerido(
    extraccion: ExtraccionDictamen,
    { proveedores, dependencias }: CargarDictamenProps,
): Destino {
    const codigo = extraccion.contrato.codigo;
    const proveedor = codigo
        ? proveedores.find((p) => p.contratos.some((c) => c.codigo === codigo))
        : undefined;
    const contrato = proveedor?.contratos.find((c) => c.codigo === codigo);
    const mencionada = extraccion.dependencia_mencionada
        ? normalizar(extraccion.dependencia_mencionada)
        : null;
    const dependencia = mencionada
        ? dependencias.find(
              (d) =>
                  normalizar(d.nombre) === mencionada ||
                  normalizar(d.sigla ?? '') === mencionada,
          )
        : undefined;

    return {
        proveedor: proveedor ? String(proveedor.id) : '',
        proveedorNuevo: { nombre: '', rubro: '' },
        contrato: contrato ? String(contrato.id) : '',
        contratoNuevo: completarContrato(extraccion.contrato),
        dependencia: dependencia ? String(dependencia.id) : '',
        evaluacion: EVALUACION_VACIA,
    };
}

const aId = (valor: string): number | null =>
    valor && valor !== NUEVO ? Number(valor) : null;

export function armarPayload(
    destino: Destino,
    documento: string,
    eventos: EventoBorrador[],
): ConfirmarDictamenPayload {
    const proveedorNuevo = destino.proveedor === NUEVO;
    const contratoNuevo = proveedorNuevo || destino.contrato === NUEVO;

    return {
        proveedor_id: aId(destino.proveedor),
        proveedor_nuevo: proveedorNuevo ? destino.proveedorNuevo : null,
        contrato_id: contratoNuevo ? null : aId(destino.contrato),
        contrato_nuevo: contratoNuevo
            ? {
                  ...destino.contratoNuevo,
                  // Un contrato en ejecución todavía no tiene fecha real de fin.
                  fecha_fin_real:
                      destino.contratoNuevo.estado === 'en_ejecucion'
                          ? null
                          : destino.contratoNuevo.fecha_fin_real,
              }
            : null,
        evaluacion:
            destino.evaluacion.calidad && destino.evaluacion.satisfaccion
                ? {
                      calidad: Number(destino.evaluacion.calidad),
                      satisfaccion: Number(destino.evaluacion.satisfaccion),
                      comentario: destino.evaluacion.comentario.trim() || null,
                  }
                : null,
        dependencia_id: aId(destino.dependencia),
        documento_origen: documento.trim(),
        eventos: eventos.map(({ clave: _clave, ...evento }) => evento),
    };
}

/** Agrupa errores de validación "eventos.0.descripcion" por índice de evento. */
export function erroresPorEvento(
    errores: Record<string, string>,
): Record<number, Partial<Record<keyof EventoExtraido, string>>> {
    const agrupados: Record<
        number,
        Partial<Record<keyof EventoExtraido, string>>
    > = {};

    for (const [clave, mensaje] of Object.entries(errores)) {
        const match = /^eventos\.(\d+)\.(\w+)$/.exec(clave);

        if (match) {
            const indice = Number(match[1]);
            agrupados[indice] = { ...agrupados[indice], [match[2]]: mensaje };
        }
    }

    return agrupados;
}
