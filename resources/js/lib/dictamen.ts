import type {
    CargarDictamenProps,
    ConfirmarDictamenPayload,
    ContratoExtraido,
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
    contratoNuevo: ContratoExtraido;
    dependencia: string;
};

const normalizar = (texto: string) =>
    texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

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
        contratoNuevo: extraccion.contrato,
        dependencia: dependencia ? String(dependencia.id) : '',
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
        contrato_nuevo: contratoNuevo ? destino.contratoNuevo : null,
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
