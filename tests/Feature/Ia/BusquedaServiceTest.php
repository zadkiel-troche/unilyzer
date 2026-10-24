<?php

namespace Tests\Feature\Ia;

use App\Models\User;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\SimulaOpenAi;
use Tests\TestCase;

/**
 * Las 4 consultas de la demo (CLAUDE.md §5.A) con la IA simulada.
 */
class BusquedaServiceTest extends TestCase
{
    use RefreshDatabase, SimulaOpenAi;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $this->actingAs(User::factory()->create());
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    private function buscar(string $q, array $filtros): TestResponse
    {
        $this->simularOpenAi(['interpretacion' => "Interpretación de: {$q}", 'filtros' => $this->filtros($filtros)]);

        return $this->postJson(route('busqueda'), ['q' => $q])->assertOk()->assertJsonPath('modo', 'ia');
    }

    /**
     * @return list<string>
     */
    private function nombres(TestResponse $respuesta): array
    {
        return array_column($respuesta->json('resultados'), 'nombre');
    }

    public function test_obras_with_late_delivery_fines_since_2024()
    {
        $r = $this->buscar('proveedores de obras con multas por atraso desde 2024', [
            'rubro' => 'obras', 'tipos_evento' => ['multa'], 'categoria' => 'plazo', 'desde' => '2024-01-01', 'orden' => 'puntaje_asc',
        ]);

        $this->assertSame(['Constructora Paraná Obras S.A.'], $this->nombres($r));
        $this->assertStringContainsString('2 multas desde 2024', $r->json('resultados.0.motivo'));
        $this->assertSame(['multa'], array_unique(array_column($r->json('resultados.0.eventos_coincidentes'), 'tipo')));
    }

    public function test_complied_on_time_but_with_quality_problems()
    {
        $r = $this->buscar('¿quién cumplió los plazos pero tuvo problemas de calidad?', [
            'sin_atrasos' => true, 'satisfaccion_max' => 3, 'orden' => 'puntaje_asc',
        ]);

        $nombres = $this->nombres($r);
        $this->assertContains('Mobiliario del Sur', $nombres);
        $this->assertNotContains('Constructora Paraná Obras S.A.', $nombres);
        $this->assertStringContainsString('0 atrasos', $r->json('resultados.'.array_search('Mobiliario del Sur', $nombres).'.motivo'));
    }

    public function test_repeated_complaints()
    {
        $r = $this->buscar('proveedores con reclamos repetidos', [
            'tipos_evento' => ['reclamo'], 'solo_reincidentes' => true, 'orden' => 'incidencias_desc',
        ]);

        $this->assertSame(['Limpieza Integral Itapúa'], $this->nombres($r));
        $this->assertStringContainsString('reincide', $r->json('resultados.0.motivo'));
    }

    public function test_best_it_providers()
    {
        $r = $this->buscar('los mejores proveedores de informática', ['rubro' => 'informatica', 'orden' => 'puntaje_desc']);

        $this->assertSame(['TecnoSur Informática', 'Redes y Datos PY'], $this->nombres($r));
    }

    public function test_the_prompt_lists_real_catalog_values_and_invalid_filters_are_dropped()
    {
        $r = $this->buscar('algo', ['rubro' => 'inventado', 'tipos_evento' => ['multa', 'otro'], 'desde' => 'ayer']);

        $r->assertJsonPath('filtros.rubro', null)
            ->assertJsonPath('filtros.tipos_evento', ['multa'])
            ->assertJsonPath('filtros.desde', null);

        Http::assertSent(fn (Request $req) => str_contains($req['messages'][0]['content'], 'mantenimiento_electrico')
            && str_contains($req['messages'][0]['content'], 'Facultad de Ingeniería'));
    }

    public function test_falls_back_to_keywords_when_the_ai_fails()
    {
        $this->simularOpenAiCaido();

        $this->postJson(route('busqueda'), ['q' => 'pupitres'])
            ->assertOk()
            ->assertJsonPath('modo', 'palabras_clave')
            ->assertJsonPath('resultados.0.nombre', 'Mobiliario del Sur');
    }

    public function test_busca_por_nombre_parcial_con_filtro_de_la_ia()
    {
        $r = $this->buscar('Constructora Paraná', ['nombre' => 'Paraná']);

        $this->assertSame(['Constructora Paraná Obras S.A.'], $this->nombres($r));
    }

    public function test_busca_por_nombre_sin_tilde_en_filtro()
    {
        $r = $this->buscar('parana', ['nombre' => 'parana']);

        $this->assertSame(['Constructora Paraná Obras S.A.'], $this->nombres($r));
    }

    public function test_infiere_nombre_cuando_la_ia_no_lo_devuelve()
    {
        $r = $this->buscar('TecnoSur', []);

        $this->assertSame(['TecnoSur Informática'], $this->nombres($r));
        $this->assertSame('tecnosur', $r->json('filtros.nombre'));
    }

    public function test_infiere_nombre_ambiguo_que_matchea_varios_proveedores()
    {
        $r = $this->buscar('constructora', []);

        $nombres = $this->nombres($r);
        $this->assertContains('Constructora Paraná Obras S.A.', $nombres);
        $this->assertContains('Vial Constructora del Este', $nombres);
        $this->assertSame('constructora', $r->json('filtros.nombre'));
    }
}
