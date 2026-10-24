<?php

namespace App\Services\Ai;

use App\Models\Contrato;
use App\Models\Evaluacion;
use App\Models\Evento;
use App\Models\Proveedor;
use App\Services\ScoringService;
use Illuminate\Support\Facades\Cache;

/**
 * Resumen de la historia clínica con citas a los eventos (CLAUDE.md §5.C).
 * Se cachea hasta que cambien los eventos del proveedor.
 *
 * @phpstan-import-type Score from ScoringService
 */
class ResumenService
{
    public const RECOMENDACIONES = ['contratar', 'contratar con condiciones', 'evitar'];

    public function __construct(private OpenAiClient $ia) {}

    /**
     * @param  Score  $score
     * @return array{resumen: string, fortalezas: list<string>, alertas: list<string>, recomendacion: string, eventos_citados: list<int>}
     *
     * @throws AiUnavailableException
     */
    public function generar(Proveedor $proveedor, array $score): array
    {
        $version = $proveedor->eventos()->max('eventos.updated_at') ?? 'sin-eventos';
        $clave = "resumen:{$proveedor->id}:".md5((string) $version.$score['puntaje']);

        // Si la IA falla, la excepción sale de remember() y no se cachea nada.
        return Cache::remember($clave, now()->addDay(), fn () => $this->pedir($proveedor, $score));
    }

    /**
     * @param  Score  $score
     * @return array{resumen: string, fortalezas: list<string>, alertas: list<string>, recomendacion: string, eventos_citados: list<int>}
     */
    private function pedir(Proveedor $proveedor, array $score): array
    {
        $proveedor->loadMissing(Proveedor::HISTORIA);
        $idsValidos = $proveedor->contratos->flatMap(fn (Contrato $c) => $c->eventos->pluck('id'))->all();

        $r = $this->ia->json(
            $this->prompt(),
            (string) json_encode($this->contexto($proveedor, $score), JSON_UNESCAPED_UNICODE),
            'resumen_proveedor',
            $this->esquema(),
        );

        $textos = fn (mixed $lista): array => array_values(array_filter(
            is_array($lista) ? $lista : [],
            fn ($t) => is_string($t) && trim($t) !== '',
        ));

        return [
            'resumen' => is_string($r['resumen'] ?? null) ? $r['resumen'] : '',
            'fortalezas' => $textos($r['fortalezas'] ?? null),
            'alertas' => $textos($r['alertas'] ?? null),
            'recomendacion' => in_array($r['recomendacion'] ?? null, self::RECOMENDACIONES, true)
                ? $r['recomendacion']
                : 'contratar con condiciones',
            // Solo ids que existen en este proveedor: la IA puede equivocarse.
            'eventos_citados' => array_values(array_unique(array_filter(
                is_array($r['eventos_citados'] ?? null) ? $r['eventos_citados'] : [],
                fn ($id) => in_array($id, $idsValidos, true),
            ))),
        ];
    }

    /**
     * JSON compacto con lo necesario para resumir.
     *
     * @param  Score  $score
     * @return array<string, mixed>
     */
    private function contexto(Proveedor $proveedor, array $score): array
    {
        return [
            'proveedor' => ['nombre' => $proveedor->nombre, 'rubro' => $proveedor->rubro],
            'puntaje' => $score['puntaje'],
            'semaforo' => $score['semaforo']['etiqueta'],
            'componentes' => array_map(fn ($c) => $c['motivo'], $score['componentes']),
            'reincidencias' => array_column($score['reincidencias'], 'descripcion'),
            'contratos' => $proveedor->contratos->map(fn (Contrato $c) => [
                'codigo' => $c->codigo,
                'objeto' => $c->objeto,
                'estado' => $c->estado,
                'dependencia' => $c->dependencia?->nombre,
                'dias_atraso' => $c->diasAtraso(),
                'eventos' => $c->eventos->map(fn (Evento $e) => [
                    'id' => $e->id,
                    'tipo' => $e->tipo,
                    'fecha' => $e->fecha?->toDateString(),
                    'categoria' => $e->categoria,
                    'descripcion' => $e->descripcion,
                ])->values()->all(),
                'evaluaciones' => $c->evaluaciones->map(fn (Evaluacion $e) => [
                    'calidad' => $e->calidad,
                    'satisfaccion' => $e->satisfaccion,
                    'comentario' => $e->comentario,
                ])->values()->all(),
            ])->values()->all(),
        ];
    }

    private function prompt(): string
    {
        return <<<'PROMPT'
        Resumís la historia clínica de un proveedor para la unidad de compras de una universidad pública.
        Basate SOLO en los datos recibidos; no inventes hechos ni cifras.
        Escribí en español claro y neutral, describiendo hechos ("se registraron tres reclamos"), sin adjetivos descalificantes.

        - "resumen": 2 a 4 oraciones. Citá los eventos en los que te basás con el formato #id dentro del texto, por ejemplo "(eventos #12, #15)".
        - "fortalezas" y "alertas": hasta 3 frases cortas cada una; si no hay, una frase que lo diga.
        - "recomendacion": contratar, contratar con condiciones o evitar, según los antecedentes. Es una sugerencia, no una decisión.
        - "eventos_citados": los ids de todos los eventos que mencionaste.
        PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function esquema(): array
    {
        return Esquema::objeto([
            'resumen' => Esquema::texto(),
            'fortalezas' => Esquema::lista(Esquema::texto()),
            'alertas' => Esquema::lista(Esquema::texto()),
            'recomendacion' => Esquema::enum(self::RECOMENDACIONES),
            'eventos_citados' => Esquema::lista(Esquema::entero()),
        ]);
    }
}
