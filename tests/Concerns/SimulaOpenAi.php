<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\Http;

/**
 * Simula respuestas de OpenAI (/chat/completions) sin salir a internet.
 */
trait SimulaOpenAi
{
    /**
     * @param  array<string, mixed>  ...$respuestas  JSON que devuelve la IA, en orden
     */
    protected function simularOpenAi(array ...$respuestas): void
    {
        config(['services.openai.key' => 'sk-test']);

        $secuencia = Http::sequence();

        foreach ($respuestas as $respuesta) {
            $secuencia->push(['choices' => [['message' => ['content' => json_encode($respuesta)]]]]);
        }

        Http::fake(['*/chat/completions' => $secuencia]);
    }

    protected function simularOpenAiCaido(int $status = 500): void
    {
        config(['services.openai.key' => 'sk-test']);
        Http::fake(['*/chat/completions' => Http::response(['error' => ['message' => 'falla']], $status)]);
    }

    /**
     * @param  array<string, mixed>  $cambios
     * @return array<string, mixed>
     */
    protected function filtros(array $cambios = []): array
    {
        return [
            'texto' => null, 'nombre' => null, 'rubro' => null, 'dependencia' => null, 'tipos_evento' => null,
            'categoria' => null, 'desde' => null, 'hasta' => null, 'sin_atrasos' => null,
            'satisfaccion_max' => null, 'puntaje_min' => null, 'puntaje_max' => null,
            'solo_reincidentes' => null, 'orden' => null, 'limite' => 10,
            ...$cambios,
        ];
    }
}
