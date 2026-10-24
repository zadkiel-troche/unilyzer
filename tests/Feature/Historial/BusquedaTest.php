<?php

namespace Tests\Feature\Historial;

use App\Models\User;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusquedaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $this->actingAs(User::factory()->create());
    }

    public function test_keyword_search_matches_event_descriptions_ignoring_accents()
    {
        $this->postJson(route('busqueda'), ['q' => 'PUPITRES con soldaduras'])
            ->assertOk()
            ->assertJsonPath('modo', 'palabras_clave')
            ->assertJsonCount(1, 'resultados')
            ->assertJsonPath('resultados.0.nombre', 'Mobiliario del Sur')
            ->assertJsonPath('resultados.0.eventos_coincidentes', fn (array $eventos) => in_array('observacion_tecnica', array_column($eventos, 'tipo'), true))
            ->assertJsonStructure(['interpretacion', 'filtros', 'resultados' => [['id', 'puntaje', 'semaforo', 'motivo']]]);
    }

    public function test_keyword_search_matches_rubro()
    {
        $this->postJson(route('busqueda'), ['q' => 'informática'])
            ->assertOk()
            ->assertJsonCount(2, 'resultados');
    }

    public function test_query_is_required()
    {
        $this->postJson(route('busqueda'), ['q' => ''])->assertUnprocessable()->assertJsonValidationErrors('q');
    }

    public function test_assistant_answers_with_speakable_text_and_providers()
    {
        $this->postJson(route('asistente.responder'), ['mensaje' => 'contame de Mobiliario del Sur', 'historial' => []])
            ->assertOk()
            ->assertJsonPath('modo', 'palabras_clave')
            ->assertJsonPath('proveedores.0.nombre', 'Mobiliario del Sur')
            ->assertJsonPath('eventos_citados', [])
            ->assertJsonStructure(['respuesta']);
    }

    public function test_assistant_says_when_there_is_no_data()
    {
        $this->postJson(route('asistente.responder'), ['mensaje' => 'zzzz qqqq'])
            ->assertOk()
            ->assertJsonPath('proveedores', [])
            ->assertJsonPath('respuesta', fn (string $r) => str_starts_with($r, 'No encontré antecedentes'));
    }
}
