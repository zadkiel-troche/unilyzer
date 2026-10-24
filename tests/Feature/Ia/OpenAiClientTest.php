<?php

namespace Tests\Feature\Ia;

use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\Esquema;
use App\Services\Ai\OpenAiClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\SimulaOpenAi;
use Tests\TestCase;

class OpenAiClientTest extends TestCase
{
    use SimulaOpenAi;

    public function test_it_sends_a_strict_json_schema_request_without_temperature()
    {
        config(['services.openai.model' => 'gpt-4.1-mini']);
        $this->simularOpenAi(['saludo' => 'hola']);

        $respuesta = app(OpenAiClient::class)->json('sistema', 'usuario', 'prueba', Esquema::objeto(['saludo' => Esquema::texto()]));

        $this->assertSame(['saludo' => 'hola'], $respuesta);
        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer sk-test')
            && $r['model'] === 'gpt-4.1-mini'
            && $r['response_format']['json_schema']['strict'] === true
            && $r['response_format']['json_schema']['schema']['additionalProperties'] === false
            && ! isset($r['temperature'])
            && $r['messages'][0]['role'] === 'system');
    }

    public function test_it_is_unavailable_without_a_key()
    {
        $this->expectException(AiUnavailableException::class);

        app(OpenAiClient::class)->json('s', 'u', 'x', Esquema::objeto([]));
    }

    public function test_http_errors_become_unavailable()
    {
        $this->simularOpenAiCaido(429);
        $this->expectException(AiUnavailableException::class);

        app(OpenAiClient::class)->json('s', 'u', 'x', Esquema::objeto([]));
    }

    public function test_nullable_schemas_use_type_arrays()
    {
        $this->assertSame(['type' => ['string', 'null']], Esquema::texto(nullable: true));
        $this->assertSame(['a', 'b', null], Esquema::enum(['a', 'b'], nullable: true)['enum']);
        $this->assertSame(['x', 'y'], Esquema::objeto(['x' => Esquema::texto(), 'y' => Esquema::entero()])['required']);
    }
}
