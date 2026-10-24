<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente mínimo de OpenAI (/chat/completions con Structured Outputs).
 * Sin SDK: usa el cliente HTTP de Laravel (CLAUDE.md §5).
 */
class OpenAiClient
{
    private const TIMEOUT_SEGUNDOS = 60;

    public function disponible(): bool
    {
        return filled(config('services.openai.key'));
    }

    /**
     * Pide una respuesta JSON que cumple `$esquema` (strict).
     *
     * @param  string|list<array{role: string, content: string}>  $usuario  mensaje o conversación previa
     * @param  array<string, mixed>  $esquema
     * @return array<string, mixed>
     *
     * @throws AiUnavailableException
     */
    public function json(string $sistema, string|array $usuario, string $nombreEsquema, array $esquema): array
    {
        if (! $this->disponible()) {
            throw new AiUnavailableException('No hay una clave de OpenAI configurada.');
        }

        $mensajes = [
            ['role' => 'system', 'content' => $sistema],
            ...(is_string($usuario) ? [['role' => 'user', 'content' => $usuario]] : $usuario),
        ];

        try {
            $respuesta = Http::withToken((string) config('services.openai.key'))
                ->acceptJson()
                ->timeout(self::TIMEOUT_SEGUNDOS)
                ->post(rtrim((string) config('services.openai.base_url'), '/').'/chat/completions', [
                    'model' => config('services.openai.model'),
                    'messages' => $mensajes,
                    'response_format' => [
                        'type' => 'json_schema',
                        'json_schema' => ['name' => $nombreEsquema, 'strict' => true, 'schema' => $esquema],
                    ],
                ]);
        } catch (ConnectionException $e) {
            throw new AiUnavailableException('No se pudo conectar con OpenAI.', previous: $e);
        }

        if ($respuesta->failed()) {
            Log::warning('OpenAI respondió con error', ['status' => $respuesta->status(), 'esquema' => $nombreEsquema]);

            throw new AiUnavailableException("OpenAI respondió con un error ({$respuesta->status()}).");
        }

        if (filled($respuesta->json('choices.0.message.refusal'))) {
            throw new AiUnavailableException('La IA se negó a responder esta solicitud.');
        }

        $datos = json_decode((string) $respuesta->json('choices.0.message.content'), true);

        if (! is_array($datos)) {
            throw new AiUnavailableException('La IA devolvió una respuesta inválida.');
        }

        return $datos;
    }
}
