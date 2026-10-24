<?php

namespace App\Services\Ai;

use App\Models\Contrato;
use App\Models\Evento;
use App\Models\Proveedor;
use App\Services\BusquedaPorPalabrasClave;
use App\Services\EstadisticasService;
use App\Services\ProveedorPresenter;
use App\Services\ScoringService;

/**
 * Asistente conversacional por voz (contrato en resources/js/types/asistente.ts).
 *
 * El dataset es chico, así que la IA recibe un resumen de todos los
 * proveedores y responde en una sola llamada (importa la latencia en voz).
 * Si la IA no está, responde con la búsqueda por palabras clave.
 *
 * @phpstan-import-type FilaDependencia from EstadisticasService
 *
 * @phpstan-type Respuesta array{modo: string, respuesta: string, proveedores: list<array<string, mixed>>, dependencias: list<FilaDependencia>, eventos_citados: list<int>}
 */
class AsistenteService
{
    private const TURNOS_DE_CONTEXTO = 6;

    private const MAX_EVENTOS_POR_PROVEEDOR = 8;

    public function __construct(
        private OpenAiClient $ia,
        private ScoringService $scoring,
        private ProveedorPresenter $presenter,
        private BusquedaPorPalabrasClave $palabrasClave,
        private EstadisticasService $estadisticas,
    ) {}

    /**
     * @param  list<array{rol: string, texto: string}>  $historial
     * @return Respuesta
     */
    public function responder(string $mensaje, array $historial = []): array
    {
        try {
            return $this->conIa($mensaje, $historial);
        } catch (AiUnavailableException) {
            return $this->sinIa($mensaje);
        }
    }

    /**
     * @param  list<array{rol: string, texto: string}>  $historial
     * @return Respuesta
     */
    private function conIa(string $mensaje, array $historial): array
    {
        $proveedores = $this->presenter->todos()->keyBy('id');
        $scores = $proveedores->map(fn (Proveedor $p) => $this->scoring->calcular($p));

        $conversacion = [];

        foreach (array_slice($historial, -self::TURNOS_DE_CONTEXTO) as $turno) {
            $conversacion[] = [
                'role' => $turno['rol'] === 'asistente' ? 'assistant' : 'user',
                'content' => $turno['texto'],
            ];
        }

        $conversacion[] = ['role' => 'user', 'content' => $mensaje];

        $dependencias = collect($this->estadisticas->porDependencia())->keyBy('id');

        $r = $this->ia->json(
            $this->prompt(
                array_values($proveedores->map(fn (Proveedor $p) => $this->ficha($p, $scores[$p->id]))->all()),
                array_values($dependencias->all()),
                $this->estadisticas->contratosPorEstado(),
            ),
            $conversacion,
            'respuesta_asistente',
            Esquema::objeto([
                'respuesta' => Esquema::texto(),
                'proveedores_ids' => Esquema::lista(Esquema::entero()),
                'dependencias_ids' => Esquema::lista(Esquema::entero()),
                'eventos_citados' => Esquema::lista(Esquema::entero()),
            ]),
        );
        $idsDependencias = array_values(array_unique(array_filter(
            is_array($r['dependencias_ids'] ?? null) ? $r['dependencias_ids'] : [],
            fn ($id) => is_int($id) && $dependencias->has($id),
        )));

        // Solo se aceptan ids que existen: la IA puede equivocarse.
        $ids = array_values(array_unique(array_filter(
            is_array($r['proveedores_ids'] ?? null) ? $r['proveedores_ids'] : [],
            fn ($id) => is_int($id) && $proveedores->has($id),
        )));
        $eventosValidos = $proveedores->flatMap(fn (Proveedor $p) => $p->contratos->flatMap(fn (Contrato $c) => $c->eventos->pluck('id')))->all();

        return [
            'modo' => 'ia',
            'respuesta' => is_string($r['respuesta'] ?? null) && trim($r['respuesta']) !== ''
                ? trim($r['respuesta'])
                : 'No tengo una respuesta para eso. Probá preguntando por un proveedor o un rubro.',
            'proveedores' => array_map(
                fn (int $id) => $this->presenter->ranking($proveedores[$id], $scores[$id]),
                array_slice($ids, 0, 8),
            ),
            'dependencias' => array_map(fn (int $id) => $dependencias[$id], array_slice($idsDependencias, 0, 6)),
            'eventos_citados' => array_values(array_unique(array_filter(
                is_array($r['eventos_citados'] ?? null) ? $r['eventos_citados'] : [],
                fn ($id) => in_array($id, $eventosValidos, true),
            ))),
        ];
    }

    /**
     * Respuesta sin IA, armada con la búsqueda por palabras clave.
     *
     * @return Respuesta
     */
    public function sinIa(string $mensaje): array
    {
        $estadistica = $this->estadisticaSinIa(BusquedaPorPalabrasClave::normalizar($mensaje));

        if ($estadistica !== null) {
            return $estadistica;
        }

        $coincidencias = $this->palabrasClave->coincidencias($this->palabrasClave->palabras($mensaje))->take(3);

        $respuesta = $coincidencias->isEmpty()
            ? 'No encontré antecedentes que respondan esa pregunta. Probá nombrando un proveedor o un rubro, por ejemplo obras, limpieza o informática.'
            : 'Encontré '.$coincidencias->count().' proveedores relacionados: '
                .$coincidencias->map(fn (array $c) => "{$c['proveedor']->nombre}, con {$c['score']['puntaje']} puntos")->join('; ', ' y ')
                .'. Podés abrir su historia clínica para ver el detalle.';

        return [
            'modo' => 'palabras_clave',
            'respuesta' => $respuesta,
            'proveedores' => array_values($coincidencias->map(fn (array $c) => $this->presenter->ranking($c['proveedor'], $c['score']))->all()),
            'dependencias' => [],
            'eventos_citados' => [],
        ];
    }

    /**
     * Preguntas de conteo sin IA: rankings de dependencias y contratos por estado.
     *
     * @return Respuesta|null
     */
    private function estadisticaSinIa(string $mensaje): ?array
    {
        $listado = $this->proveedoresDeDependenciaSinIa($mensaje);

        if ($listado !== null) {
            return $listado;
        }

        $porDependencia = str_contains($mensaje, 'dependencia');
        $porEstado = str_contains($mensaje, 'estado')
            || (str_contains($mensaje, 'contrato') && preg_match('/ejecucion|finalizad|rescindid|vigente|abiert|cerrad/', $mensaje));

        if ($porDependencia) {
            $criterio = str_contains($mensaje, 'proveedor') ? 'proveedores' : 'contratos';
            $menos = (bool) preg_match('/\b(menos|menor|menores|pocos|minimo)\b/', $mensaje);
            $filas = collect($this->estadisticas->porDependencia())
                ->sortBy([[$criterio, $menos ? 'asc' : 'desc'], ['nombre', 'asc']])
                ->values();
            $top = $filas->take(3);
            $primera = $top->first();

            if ($primera === null) {
                return null;
            }

            $siguen = $top->slice(1)->map(fn (array $f) => "{$f['nombre']} con {$f[$criterio]}")->join(' y ');

            return $this->respuestaEstadistica(
                'La dependencia con '.($menos ? 'menos' : 'más')." {$criterio} es {$primera['nombre']}, con {$primera[$criterio]}."
                    .($siguen !== '' ? " Le siguen {$siguen}." : ''),
                array_values($top->all()),
            );
        }

        if ($porEstado) {
            $e = $this->estadisticas->contratosPorEstado();
            $total = array_sum($e);

            return $this->respuestaEstadistica(
                "Hay {$total} contratos registrados: {$e['en_ejecucion']} en ejecución, "
                    .self::cantidad($e['finalizado'], 'finalizado', 'finalizados').' y '
                    .self::cantidad($e['rescindido'], 'rescindido', 'rescindidos').'.',
                $this->estadisticas->porDependencia(),
            );
        }

        return null;
    }

    /**
     * "¿Qué proveedores tiene la Facultad de Ingeniería?" o "proveedores de la DTIC".
     *
     * @return Respuesta|null
     */
    private function proveedoresDeDependenciaSinIa(string $mensaje): ?array
    {
        if (! str_contains($mensaje, 'proveedor')) {
            return null;
        }

        $fila = collect($this->estadisticas->porDependencia())->first(function (array $f) use ($mensaje) {
            $sigla = $f['sigla'] !== null ? BusquedaPorPalabrasClave::normalizar($f['sigla']) : null;

            return str_contains($mensaje, BusquedaPorPalabrasClave::normalizar($f['nombre']))
                || ($sigla !== null && preg_match('/\b'.preg_quote($sigla, '/').'\b/', $mensaje) === 1);
        });

        if ($fila === null) {
            return null;
        }

        $lista = $fila['lista_proveedores'];
        $texto = $lista === []
            ? "{$fila['nombre']} todavía no tiene contratos registrados."
            : "{$fila['nombre']} trabajó con ".self::cantidad(count($lista), 'proveedor', 'proveedores').': '
                .collect($lista)->map(fn (array $p) => $p['nombre'].' ('.self::cantidad($p['contratos'], 'contrato', 'contratos').')')->join(', ', ' y ').'.';

        $proveedores = Proveedor::with(Proveedor::HISTORIA)->whereKey(array_column($lista, 'id'))->get()->keyBy('id');

        return [
            ...$this->respuestaEstadistica($texto, [$fila]),
            'proveedores' => array_values(array_filter(array_map(
                fn (array $p) => $proveedores->has($p['id']) ? $this->presenter->ranking($proveedores[$p['id']]) : null,
                $lista,
            ))),
        ];
    }

    private static function cantidad(int $n, string $singular, string $plural): string
    {
        return $n.' '.($n === 1 ? $singular : $plural);
    }

    /**
     * @param  list<FilaDependencia>  $dependencias
     * @return Respuesta
     */
    private function respuestaEstadistica(string $texto, array $dependencias): array
    {
        return [
            'modo' => 'palabras_clave',
            'respuesta' => $texto,
            'proveedores' => [],
            'dependencias' => $dependencias,
            'eventos_citados' => [],
        ];
    }

    /**
     * Ficha compacta de un proveedor para el contexto de la IA.
     *
     * @param  array<string, mixed>  $score
     * @return array<string, mixed>
     */
    private function ficha(Proveedor $proveedor, array $score): array
    {
        $eventos = $proveedor->contratos
            ->flatMap(fn (Contrato $c) => $c->eventos)
            ->sortByDesc(fn (Evento $e) => [$e->esNegativo(), $e->fecha?->toDateString() ?? ''])
            ->take(self::MAX_EVENTOS_POR_PROVEEDOR)
            ->map(fn (Evento $e) => [
                'id' => $e->id,
                'tipo' => $e->tipo,
                'fecha' => $e->fecha?->toDateString(),
                'descripcion' => $e->descripcion,
            ])
            ->values()
            ->all();

        return [
            'id' => $proveedor->id,
            'nombre' => $proveedor->nombre,
            'rubro' => $proveedor->rubro,
            'puntaje' => $score['puntaje'],
            'estado' => $score['semaforo']['etiqueta'],
            'resumen' => $this->presenter->motivo($score),
            'reincidencias' => array_column($score['reincidencias'], 'descripcion'),
            'eventos' => $eventos,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $fichas
     * @param  list<FilaDependencia>  $dependencias
     * @param  array<string, int>  $estados
     */
    private function prompt(array $fichas, array $dependencias, array $estados): string
    {
        $datos = json_encode($fichas, JSON_UNESCAPED_UNICODE);
        $porDependencia = json_encode($dependencias, JSON_UNESCAPED_UNICODE);
        $porEstado = json_encode($estados, JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
        Sos el asistente de voz de Unilyzer: ayudás a la unidad de compras de una universidad pública a conocer la historia de sus proveedores.
        Tu respuesta se va a LEER EN VOZ ALTA, así que:
        - Respondé en español neutro, con 2 a 4 oraciones cortas y naturales.
        - No uses markdown, viñetas, emojis, ids ni símbolos como "#". Decí los números como los diría una persona.
        - Basate SOLO en los datos de abajo. Si no hay antecedentes para responder, decilo con claridad y sugerí qué preguntar.
        - Describí hechos registrados ("tuvo dos multas por atraso"), no juicios definitivos. La decisión final es de las personas.

        Devolvé también:
        - "proveedores_ids": los ids de los proveedores que mencionás, en orden de relevancia (máximo 8).
        - "dependencias_ids": si la pregunta es sobre dependencias, sus ids en el orden en que las nombrás (máximo 6); si no, [].
        - "eventos_citados": los ids de los eventos en los que te basás.

        Para preguntas de conteo (qué dependencias tienen más o menos contratos o proveedores, cuántos contratos hay en
        ejecución, finalizados o rescindidos) usá las estadísticas: "contratos" es la cantidad de contratos, "proveedores"
        la cantidad de proveedores distintos y "por_estado" el desglose. Nombrá las tres primeras y su número.
        Si preguntan qué proveedores trabajan con una dependencia, usá su "lista_proveedores": nombralos y devolvé sus ids
        en "proveedores_ids" y el id de la dependencia en "dependencias_ids".

        Datos de los proveedores (JSON):
        {$datos}

        Estadísticas por dependencia (JSON, ordenadas de más a menos contratos):
        {$porDependencia}

        Contratos de toda la institución por estado (JSON):
        {$porEstado}
        PROMPT;
    }
}
