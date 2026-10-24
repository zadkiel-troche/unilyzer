<?php

namespace App\Services\Ai;

use App\Models\Contrato;
use App\Models\Evento;
use App\Models\Proveedor;
use App\Services\BusquedaPorPalabrasClave;
use App\Services\ProveedorPresenter;
use App\Services\ScoringService;

/**
 * Asistente conversacional por voz (contrato en resources/js/types/asistente.ts).
 *
 * El dataset es chico, así que la IA recibe un resumen de todos los
 * proveedores y responde en una sola llamada (importa la latencia en voz).
 * Si la IA no está, responde con la búsqueda por palabras clave.
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
    ) {}

    /**
     * @param  list<array{rol: string, texto: string}>  $historial
     * @return array{modo: string, respuesta: string, proveedores: list<array<string, mixed>>, eventos_citados: list<int>}
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
     * @return array{modo: string, respuesta: string, proveedores: list<array<string, mixed>>, eventos_citados: list<int>}
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

        $r = $this->ia->json(
            $this->prompt(array_values($proveedores->map(fn (Proveedor $p) => $this->ficha($p, $scores[$p->id]))->all())),
            $conversacion,
            'respuesta_asistente',
            Esquema::objeto([
                'respuesta' => Esquema::texto(),
                'proveedores_ids' => Esquema::lista(Esquema::entero()),
                'eventos_citados' => Esquema::lista(Esquema::entero()),
            ]),
        );

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
                array_slice($ids, 0, 4),
            ),
            'eventos_citados' => array_values(array_unique(array_filter(
                is_array($r['eventos_citados'] ?? null) ? $r['eventos_citados'] : [],
                fn ($id) => in_array($id, $eventosValidos, true),
            ))),
        ];
    }

    /**
     * Respuesta sin IA, armada con la búsqueda por palabras clave.
     *
     * @return array{modo: string, respuesta: string, proveedores: list<array<string, mixed>>, eventos_citados: list<int>}
     */
    public function sinIa(string $mensaje): array
    {
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
     */
    private function prompt(array $fichas): string
    {
        $datos = json_encode($fichas, JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
        Sos el asistente de voz de Unilyzer: ayudás a la unidad de compras de una universidad pública a conocer la historia de sus proveedores.
        Tu respuesta se va a LEER EN VOZ ALTA, así que:
        - Respondé en español neutro, con 2 a 4 oraciones cortas y naturales.
        - No uses markdown, viñetas, emojis, ids ni símbolos como "#". Decí los números como los diría una persona.
        - Basate SOLO en los datos de abajo. Si no hay antecedentes para responder, decilo con claridad y sugerí qué preguntar.
        - Describí hechos registrados ("tuvo dos multas por atraso"), no juicios definitivos. La decisión final es de las personas.

        Devolvé también:
        - "proveedores_ids": los ids de los proveedores que mencionás, en orden de relevancia (máximo 4).
        - "eventos_citados": los ids de los eventos en los que te basás.

        Datos de los proveedores (JSON):
        {$datos}
        PROMPT;
    }
}
