<?php

namespace Tests\Feature\Ia;

use App\Models\Dependencia;
use App\Models\User;
use App\Services\EstadisticasService;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\SimulaOpenAi;
use Tests\TestCase;

/**
 * Preguntas de conteo: dependencias con más o menos contratos y proveedores,
 * y contratos por estado, por voz o por texto.
 */
class EstadisticasAsistenteTest extends TestCase
{
    use RefreshDatabase, SimulaOpenAi;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $this->actingAs(User::factory()->create());
    }

    public function test_statistics_by_dependency_and_status()
    {
        $servicio = app(EstadisticasService::class);
        $filas = collect($servicio->porDependencia())->keyBy('sigla');

        $this->assertSame('FI', $servicio->porDependencia()[0]['sigla']);
        $this->assertSame(7, $filas['FI']['contratos']);
        $this->assertSame(6, $filas['FI']['proveedores']);
        $this->assertSame(2, $filas['DTIC']['proveedores']);
        $this->assertSame(28, $filas->sum('contratos'));
        $this->assertSame(['en_ejecucion' => 2, 'finalizado' => 25, 'rescindido' => 1], $servicio->contratosPorEstado());
    }

    public function test_without_ai_it_ranks_dependencies_by_contracts()
    {
        $this->postJson(route('asistente.responder'), ['mensaje' => '¿Qué dependencias tienen más contratos?'])
            ->assertOk()
            ->assertJsonPath('modo', 'palabras_clave')
            ->assertJsonPath('dependencias.0.sigla', 'FI')
            ->assertJsonPath('respuesta', fn (string $r) => str_starts_with($r, 'La dependencia con más contratos es Facultad de Ingeniería, con 7.'));
    }

    public function test_without_ai_it_ranks_dependencies_with_fewer_providers()
    {
        $this->postJson(route('asistente.responder'), ['mensaje' => 'dependencias con menos proveedores'])
            ->assertOk()
            ->assertJsonPath('dependencias.0.sigla', 'DTIC')
            ->assertJsonPath('respuesta', fn (string $r) => str_contains($r, 'menos proveedores es Dirección de TIC, con 2'));
    }

    public function test_without_ai_it_counts_contracts_by_status()
    {
        $this->postJson(route('asistente.responder'), ['mensaje' => '¿Cuántos contratos hay en ejecución?'])
            ->assertOk()
            ->assertJsonPath('respuesta', 'Hay 28 contratos registrados: 2 en ejecución, 25 finalizados y 1 rescindido.')
            ->assertJsonCount(6, 'dependencias');
    }

    public function test_with_ai_it_receives_the_statistics_and_returns_the_named_dependencies()
    {
        $fi = Dependencia::where('sigla', 'FI')->value('id');
        $fcm = Dependencia::where('sigla', 'FCM')->value('id');

        $this->simularOpenAi([
            'respuesta' => 'La Facultad de Ingeniería tiene siete contratos, seguida por Ciencias Médicas con cinco.',
            'proveedores_ids' => [],
            'dependencias_ids' => [$fi, $fcm, 999999],
            'eventos_citados' => [],
        ]);

        $this->postJson(route('asistente.responder'), ['mensaje' => '¿Qué dependencias contratan más?'])
            ->assertOk()
            ->assertJsonPath('modo', 'ia')
            ->assertJsonCount(2, 'dependencias')
            ->assertJsonPath('dependencias.0.contratos', 7)
            ->assertJsonPath('dependencias.1.sigla', 'FCM');

        Http::assertSent(fn (Request $r) => str_contains($r['messages'][0]['content'], 'Estadísticas por dependencia')
            && str_contains($r['messages'][0]['content'], '"por_estado"')
            && isset($r['response_format']['json_schema']['schema']['properties']['dependencias_ids']));
    }
}
