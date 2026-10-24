<?php

namespace Tests\Feature\Historial;

use App\Models\Proveedor;
use App\Services\ScoringService;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoringServiceTest extends TestCase
{
    use RefreshDatabase;

    /** Puntajes esperados de los perfiles de la demo (CLAUDE.md §8). */
    private const ESPERADOS = [
        'Constructora Paraná Obras S.A.' => [17, 'rojo'],
        'TecnoSur Informática' => [97, 'verde'],
        'Limpieza Integral Itapúa' => [71, 'amarillo'],
        'Mobiliario del Sur' => [70, 'amarillo'],
        'LabQuímica Insumos' => [66, 'amarillo'],
        'Seguridad Total S.R.L.' => [73, 'amarillo'],
        'Eléctrica Encarnación' => [98, 'verde'],
        'Catering Universitario' => [74, 'amarillo'],
        'Redes y Datos PY' => [68, 'amarillo'],
        'Vial Constructora del Este' => [97, 'verde'],
    ];

    public function test_seeded_profiles_get_the_expected_scores()
    {
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $scoring = app(ScoringService::class);

        $obtenidos = Proveedor::with(Proveedor::HISTORIA)->get()->mapWithKeys(function (Proveedor $p) use ($scoring) {
            $score = $scoring->calcular($p);

            return [$p->nombre => [$score['puntaje'], $score['semaforo']['nivel']]];
        })->all();

        $this->assertEqualsCanonicalizing(self::ESPERADOS, $obtenidos);
    }

    public function test_star_case_complies_on_time_but_has_quality_problems()
    {
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $mobiliario = Proveedor::with(Proveedor::HISTORIA)->where('nombre', 'Mobiliario del Sur')->sole();

        $score = app(ScoringService::class)->calcular($mobiliario);

        $this->assertSame(100, $score['componentes']['plazos']['puntaje']);
        $this->assertSame(33, $score['componentes']['calidad']['puntaje']);
        $this->assertSame(0, $score['metricas']['contratos_con_atraso']);
        $this->assertCount(1, $score['reincidencias']);
        $this->assertSame(['observacion_tecnica', 'materiales'], [
            $score['reincidencias'][0]['tipo'],
            $score['reincidencias'][0]['categoria'],
        ]);
    }

    public function test_provider_without_history_gets_neutral_components()
    {
        $proveedor = Proveedor::create(['nombre' => 'Nuevo S.A.', 'rubro' => 'obras']);

        $score = app(ScoringService::class)->calcular($proveedor->load(Proveedor::HISTORIA));

        $this->assertSame(70, $score['componentes']['plazos']['puntaje']);
        $this->assertSame(60, $score['componentes']['calidad']['puntaje']);
        $this->assertSame(100, $score['componentes']['incidencias']['puntaje']);
        $this->assertSame(100, $score['componentes']['reincidencia']['puntaje']);
        $this->assertSame('Sin contratos cerrados: valor neutro', $score['componentes']['plazos']['motivo']);
    }

    public function test_late_delivery_counts_even_without_an_atraso_event()
    {
        $proveedor = Proveedor::create(['nombre' => 'Lento S.A.', 'rubro' => 'obras']);
        $proveedor->contratos()->create([
            'objeto' => 'Obra',
            'fecha_fin_pactada' => '2025-01-10',
            'fecha_fin_real' => '2025-01-20',
            'estado' => 'finalizado',
        ]);

        $score = app(ScoringService::class)->calcular($proveedor->load(Proveedor::HISTORIA));

        $this->assertSame(0, $score['componentes']['plazos']['puntaje']);
        $this->assertSame(10.0, $score['metricas']['atraso_promedio_dias']);
    }
}
