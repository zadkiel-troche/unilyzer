/**
 * Contratos de datos con el backend (CLAUDE.md §4-§6).
 * Si cambia una forma, avisar al equipo antes de modificarla.
 */

export type TipoEvento =
    | 'atraso'
    | 'multa'
    | 'prorroga'
    | 'reclamo'
    | 'observacion_tecnica'
    | 'ampliacion'
    | 'terminacion'
    | 'cambio_administrativo'
    | 'recepcion_conforme';

export type EstadoContrato = 'en_ejecucion' | 'finalizado' | 'rescindido';

export type NivelSemaforo = 'verde' | 'amarillo' | 'rojo';

export type Semaforo = {
    nivel: NivelSemaforo;
    etiqueta: string;
};

export type Dependencia = {
    id: number;
    nombre: string;
    sigla: string | null;
};

export type Proveedor = {
    id: number;
    nombre: string;
    ruc: string | null;
    rubro: string;
    ficticio: boolean;
};

export type Evento = {
    id: number;
    contrato_id: number;
    tipo: TipoEvento;
    fecha: string | null;
    dias: number | null;
    monto: number | null;
    categoria: string | null;
    descripcion: string;
    extracto_fuente: string | null;
    documento_origen: string | null;
    extraido_por_ia: boolean;
};

export type EventoTimeline = Evento & {
    contrato_codigo: string | null;
};

export type Evaluacion = {
    id: number;
    contrato_id: number;
    dependencia_id: number | null;
    calidad: number;
    satisfaccion: number;
    comentario: string | null;
};

export type Contrato = {
    id: number;
    proveedor_id: number;
    dependencia_id: number | null;
    codigo: string | null;
    objeto: string;
    monto: number | null;
    fecha_inicio: string | null;
    fecha_fin_pactada: string | null;
    fecha_fin_real: string | null;
    estado: EstadoContrato;
    dias_atraso: number;
    dependencia: Dependencia | null;
    eventos: Evento[];
    evaluaciones: Evaluacion[];
};

// --- Evaluación final (ScoringService) ---

export type ComponenteScore = {
    puntaje: number;
    motivo: string;
};

export type ClaveComponente =
    | 'plazos'
    | 'calidad'
    | 'incidencias'
    | 'reincidencia';

export type Reincidencia = {
    tipo: TipoEvento;
    categoria: string;
    contratos: number;
    veces: number;
    eventos: number[];
    descripcion: string;
};

export type Metricas = {
    contratos: number;
    finalizados: number;
    rescindidos: number;
    monto_total: number;
    contratos_con_atraso: number;
    atraso_promedio_dias: number;
    atrasos: number;
    multas: number;
    monto_multas: number;
    reclamos: number;
    observaciones_tecnicas: number;
    prorrogas: number;
    ampliaciones: number;
    terminaciones: number;
    calidad_promedio: number | null;
    satisfaccion_promedio: number | null;
};

export type Score = {
    puntaje: number;
    semaforo: Semaforo;
    componentes: Record<ClaveComponente, ComponenteScore>;
    metricas: Metricas;
    reincidencias: Reincidencia[];
};

// --- Búsqueda en lenguaje natural (BusquedaService) ---

export type OrdenBusqueda = 'puntaje_asc' | 'puntaje_desc' | 'incidencias_desc';

export type FiltrosBusqueda = {
    texto: string | null;
    nombre: string | null;
    rubro: string | null;
    dependencia: string | null;
    tipos_evento: TipoEvento[] | null;
    categoria: string | null;
    desde: string | null;
    hasta: string | null;
    sin_atrasos: boolean | null;
    satisfaccion_max: number | null;
    puntaje_min: number | null;
    puntaje_max: number | null;
    solo_reincidentes: boolean | null;
    orden: OrdenBusqueda | null;
    limite: number | null;
};

export type EventoCoincidente = Pick<
    Evento,
    'id' | 'tipo' | 'fecha' | 'descripcion'
>;

export type ResultadoBusqueda = {
    id: number;
    nombre: string;
    rubro: string;
    puntaje: number;
    semaforo: Semaforo;
    motivo: string;
    eventos_coincidentes: EventoCoincidente[];
};

export type ModoBusqueda = 'ia' | 'palabras_clave';

export type BusquedaRespuesta = {
    modo: ModoBusqueda;
    interpretacion: string;
    filtros: Partial<FiltrosBusqueda>;
    resultados: ResultadoBusqueda[];
};

// --- Resumen de la historia clínica (ResumenService) ---

export type Recomendacion =
    | 'contratar'
    | 'contratar con condiciones'
    | 'evitar';

export type ResumenIa = {
    resumen: string;
    fortalezas: string[];
    alertas: string[];
    recomendacion: Recomendacion;
    eventos_citados: number[];
};

// --- Extracción de dictámenes (ExtractorService) ---

export type EventoExtraido = Pick<
    Evento,
    | 'tipo'
    | 'fecha'
    | 'dias'
    | 'monto'
    | 'categoria'
    | 'descripcion'
    | 'extracto_fuente'
>;

export type ContratoExtraido = Pick<
    Contrato,
    'codigo' | 'objeto' | 'monto' | 'fecha_inicio' | 'fecha_fin_pactada'
>;

export type ExtraccionDictamen = {
    proveedor_mencionado: string | null;
    contrato: ContratoExtraido;
    dependencia_mencionada: string | null;
    resumen: string;
    eventos: EventoExtraido[];
};

/** Contrato que se crea al guardar: lo extraído más el estado y la fecha real de fin. */
export type ContratoNuevo = ContratoExtraido & {
    estado: EstadoContrato;
    fecha_fin_real: string | null;
};

/** Evaluación de la dependencia sobre el contrato (notas de 1 a 5). */
export type EvaluacionNueva = {
    calidad: number;
    satisfaccion: number;
    comentario: string | null;
};

export type ConfirmarDictamenPayload = {
    proveedor_id: number | null;
    proveedor_nuevo: { nombre: string; rubro: string } | null;
    contrato_id: number | null;
    contrato_nuevo: ContratoNuevo | null;
    /** Opcional: se guarda si la dependencia calificó calidad y satisfacción. */
    evaluacion: EvaluacionNueva | null;
    dependencia_id: number | null;
    documento_origen: string;
    /** `extraido_por_ia` es false en los eventos que el usuario agregó a mano. */
    eventos: (EventoExtraido & { extraido_por_ia: boolean })[];
};

// --- Props de páginas ---

export type ProveedorRanking = Omit<ResultadoBusqueda, 'eventos_coincidentes'>;

export type DashboardProps = {
    kpis: {
        proveedores: number;
        contratos: number;
        monto_total: number;
        reclamos: number;
    };
    criticos: ProveedorRanking[];
    confiables: ProveedorRanking[];
};

export type HistoriaClinicaProps = {
    proveedor: Proveedor;
    score: Score;
    contratos: Contrato[];
    timeline: EventoTimeline[];
};

export type ProveedorOpcion = Pick<Proveedor, 'id' | 'nombre' | 'rubro'> & {
    contratos: Pick<Contrato, 'id' | 'codigo' | 'objeto'>[];
};

export type CargarDictamenProps = {
    proveedores: ProveedorOpcion[];
    dependencias: Dependencia[];
};

// --- Lectura de documentos (POST /dictamenes/extraer-texto) ---

export type TextoExtraido = {
    texto: string;
    /** Nombre del archivo sin extensión. */
    documento: string;
    formato: string;
    caracteres: number;
};
