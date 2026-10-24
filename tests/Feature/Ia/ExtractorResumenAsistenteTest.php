<?php

namespace Tests\Feature\Ia;

use App\Models\Evento;
use App\Models\Proveedor;
use App\Models\User;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\SimulaOpenAi;
use Tests\TestCase;

class ExtractorResumenAsistenteTest extends TestCase
{
    use RefreshDatabase, SimulaOpenAi;

    private const DICTAMEN = 'INFORME TÉCNICO (ficticio). Se verificaron deformaciones en los estantes entregados por [CONTRATISTA].';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $this->actingAs(User::factory()->create());
    }

    public function test_extraction_normalizes_events_and_saves_nothing()
    {
        $this->simularOpenAi([
            'proveedor_mencionado' => '[CONTRATISTA]',
            'contrato' => ['codigo' => 'LCO-012/2024', 'objeto' => null, 'monto' => null, 'fecha_inicio' => 'no sé', 'fecha_fin_pactada' => '2024-05-31'],
            'dependencia_mencionada' => 'Rectorado',
            'resumen' => 'Informe sobre estanterías defectuosas.',
            'eventos' => [
                ['tipo' => 'observacion_tecnica', 'fecha' => '2025-02-18', 'dias' => null, 'monto' => null, 'categoria' => 'materiales', 'descripcion' => 'Estantes deformados', 'extracto_fuente' => 'se verificaron deformaciones en los estantes'],
                ['tipo' => 'reclamo', 'fecha' => '18/02/2025', 'dias' => -3, 'monto' => null, 'categoria' => 'inventada', 'descripcion' => 'Intimación', 'extracto_fuente' => null],
                ['tipo' => 'inexistente', 'fecha' => null, 'dias' => null, 'monto' => null, 'categoria' => null, 'descripcion' => 'x', 'extracto_fuente' => null],
            ],
        ]);
        $antes = Evento::count();

        $this->postJson(route('dictamenes.analizar'), ['texto' => self::DICTAMEN])
            ->assertOk()
            ->assertJsonPath('contrato.objeto', '')
            ->assertJsonPath('contrato.fecha_inicio', null)
            ->assertJsonPath('contrato.fecha_fin_pactada', '2024-05-31')
            ->assertJsonCount(2, 'eventos')
            ->assertJsonPath('eventos.1.fecha', null)
            ->assertJsonPath('eventos.1.dias', null)
            ->assertJsonPath('eventos.1.categoria', null);

        $this->assertSame($antes, Evento::count());
        Http::assertSent(fn (Request $r) => str_contains($r['messages'][1]['content'], '[CONTRATISTA]'));
    }

    public function test_extraction_returns_503_when_the_ai_fails()
    {
        $this->simularOpenAiCaido();

        $this->postJson(route('dictamenes.analizar'), ['texto' => self::DICTAMEN])
            ->assertStatus(503)
            ->assertJsonPath('message', fn (string $m) => str_contains($m, 'a mano'));
    }

    public function test_summary_keeps_only_events_of_the_provider_and_is_cached()
    {
        $mobiliario = Proveedor::where('nombre', 'Mobiliario del Sur')->sole();
        $propio = $mobiliario->eventos()->value('eventos.id');
        $ajeno = Proveedor::where('nombre', 'TecnoSur Informática')->sole()->eventos()->value('eventos.id');

        $this->simularOpenAi([
            'resumen' => "Cumplió los plazos pero con observaciones (evento #{$propio}).",
            'fortalezas' => ['Entregas a tiempo'],
            'alertas' => ['Materiales por debajo del pliego', ''],
            'recomendacion' => 'contratar con condiciones',
            'eventos_citados' => [$propio, $ajeno, 999999],
        ]);

        $this->postJson(route('proveedores.resumen', $mobiliario))
            ->assertOk()
            ->assertJsonPath('eventos_citados', [$propio])
            ->assertJsonPath('alertas', ['Materiales por debajo del pliego'])
            ->assertJsonPath('recomendacion', 'contratar con condiciones');

        $this->postJson(route('proveedores.resumen', $mobiliario))->assertOk();
        Http::assertSentCount(1);
    }

    public function test_assistant_answers_with_ai_and_validates_ids()
    {
        $mobiliario = Proveedor::where('nombre', 'Mobiliario del Sur')->sole();

        $this->simularOpenAi([
            'respuesta' => 'Mobiliario del Sur cumplió los plazos, pero tuvo observaciones técnicas por materiales.',
            'proveedores_ids' => [$mobiliario->id, 999999],
            'eventos_citados' => [999999],
        ]);

        $this->postJson(route('asistente.responder'), [
            'mensaje' => '¿Cómo le fue a Mobiliario del Sur?',
            'historial' => [['rol' => 'usuario', 'texto' => 'Hola'], ['rol' => 'asistente', 'texto' => 'Hola, ¿en qué te ayudo?']],
        ])
            ->assertOk()
            ->assertJsonPath('modo', 'ia')
            ->assertJsonCount(1, 'proveedores')
            ->assertJsonPath('proveedores.0.nombre', 'Mobiliario del Sur')
            ->assertJsonPath('eventos_citados', []);

        Http::assertSent(fn (Request $r) => count($r['messages']) === 4
            && $r['messages'][2]['role'] === 'assistant'
            && str_contains($r['messages'][0]['content'], 'Mobiliario del Sur'));
    }

    public function test_assistant_falls_back_to_keywords_when_the_ai_fails()
    {
        $this->simularOpenAiCaido();

        $this->postJson(route('asistente.responder'), ['mensaje' => 'contame de Mobiliario del Sur'])
            ->assertOk()
            ->assertJsonPath('modo', 'palabras_clave')
            ->assertJsonPath('proveedores.0.nombre', 'Mobiliario del Sur');
    }
}
