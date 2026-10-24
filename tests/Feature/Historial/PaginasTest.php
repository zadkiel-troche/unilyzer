<?php

namespace Tests\Feature\Historial;

use App\Models\Proveedor;
use App\Models\User;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaginasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
    }

    public function test_guests_are_redirected_to_login()
    {
        foreach (['dashboard', 'proveedores.index', 'dictamenes.create', 'asistente.index'] as $ruta) {
            $this->get(route($ruta))->assertRedirect(route('login'));
        }
    }

    public function test_dashboard_shows_kpis_and_rankings()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('kpis.proveedores', 10)
                ->where('kpis.contratos', 28)
                ->where('kpis.reclamos', 8)
                ->has('criticos', 5)
                ->where('criticos.0.nombre', 'Constructora Paraná Obras S.A.')
                ->has('confiables', 5)
                ->where('confiables.0.puntaje', 98));
    }

    public function test_providers_are_listed_by_score()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('proveedores.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('proveedores/index')
                ->has('proveedores', 10)
                ->where('proveedores.0.puntaje', 98)
                ->where('proveedores.9.puntaje', 17)
                ->has('proveedores.0.eventos_coincidentes'));
    }

    public function test_clinical_history_has_score_contracts_and_timeline()
    {
        $mobiliario = Proveedor::where('nombre', 'Mobiliario del Sur')->sole();

        $this->actingAs(User::factory()->create())
            ->get(route('proveedores.show', $mobiliario))
            ->assertInertia(fn (Assert $page) => $page
                ->component('proveedores/show')
                ->where('proveedor.nombre', 'Mobiliario del Sur')
                ->where('proveedor.ficticio', true)
                ->where('score.puntaje', 70)
                ->has('contratos', 3)
                ->has('contratos.0.dependencia')
                ->where('contratos.0.dias_atraso', 0)
                ->has('timeline', 6)
                ->has('timeline.0.contrato_codigo'));
    }

    public function test_upload_page_lists_providers_with_contracts_and_dependencies()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dictamenes.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dictamenes/cargar')
                ->has('proveedores', 10)
                ->has('proveedores.0.contratos.0.codigo')
                ->has('dependencias', 6));
    }

    public function test_ai_features_report_unavailable_without_an_api_key()
    {
        $usuario = User::factory()->create();
        $proveedor = Proveedor::first();

        $this->actingAs($usuario)->postJson(route('proveedores.resumen', $proveedor))->assertStatus(503);
        $this->actingAs($usuario)->postJson(route('dictamenes.analizar'), ['texto' => str_repeat('Dictamen de prueba. ', 3)])->assertStatus(503);
    }
}
