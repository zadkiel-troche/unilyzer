<?php

namespace Tests\Feature\Historial;

use App\Models\Contrato;
use App\Models\Dependencia;
use App\Models\Evento;
use App\Models\Proveedor;
use App\Models\User;
use App\Services\ScoringService;
use Database\Seeders\DependenciaSeeder;
use Database\Seeders\ProveedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfirmarDictamenTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([DependenciaSeeder::class, ProveedorSeeder::class]);
        $this->actingAs(User::factory()->create());
    }

    /**
     * @param  array<string, mixed>  $cambios
     * @return array<string, mixed>
     */
    private function evento(array $cambios = []): array
    {
        return [
            'tipo' => 'reclamo',
            'fecha' => '2025-02-20',
            'dias' => null,
            'monto' => null,
            'categoria' => 'calidad',
            'descripcion' => 'Intimación para reponer estanterías defectuosas',
            'extracto_fuente' => 'se intima a [CONTRATISTA] a reponer los elementos',
            'extraido_por_ia' => true,
            ...$cambios,
        ];
    }

    public function test_events_are_saved_on_an_existing_contract_and_change_the_score()
    {
        $proveedor = Proveedor::where('nombre', 'Mobiliario del Sur')->sole();
        $contrato = $proveedor->contratos()->where('codigo', 'LCO-012/2024')->sole();
        $antes = app(ScoringService::class)->calcular($proveedor->load(Proveedor::HISTORIA))['puntaje'];

        $this->post(route('dictamenes.confirmar'), [
            'proveedor_id' => $proveedor->id,
            'contrato_id' => $contrato->id,
            'dependencia_id' => Dependencia::where('sigla', 'REC')->value('id'),
            'documento_origen' => 'Informe técnico ficticio 12/2025',
            'eventos' => [$this->evento(), $this->evento(['tipo' => 'atraso', 'categoria' => 'plazo', 'dias' => 10, 'extraido_por_ia' => false])],
        ])->assertRedirect(route('proveedores.show', $proveedor));

        $this->assertDatabaseHas('eventos', [
            'contrato_id' => $contrato->id,
            'tipo' => 'reclamo',
            'extraido_por_ia' => true,
            'documento_origen' => 'Informe técnico ficticio 12/2025',
        ]);
        $this->assertDatabaseHas('eventos', ['contrato_id' => $contrato->id, 'tipo' => 'atraso', 'extraido_por_ia' => false]);

        $despues = app(ScoringService::class)->calcular($proveedor->fresh()->load(Proveedor::HISTORIA))['puntaje'];
        $this->assertLessThan($antes, $despues);
    }

    public function test_a_new_provider_and_contract_can_be_created()
    {
        $this->post(route('dictamenes.confirmar'), [
            'proveedor_id' => null,
            'proveedor_nuevo' => ['nombre' => 'Proveedor Ficticio Nuevo', 'rubro' => 'obras'],
            'contrato_id' => null,
            'contrato_nuevo' => ['codigo' => 'LPN-099/2026', 'objeto' => 'Obra de prueba', 'monto' => null, 'fecha_inicio' => null, 'fecha_fin_pactada' => '2026-12-01'],
            'dependencia_id' => Dependencia::where('sigla', 'FI')->value('id'),
            'documento_origen' => '',
            'eventos' => [$this->evento()],
        ])->assertRedirect();

        $proveedor = Proveedor::where('nombre', 'Proveedor Ficticio Nuevo')->sole();
        $contrato = $proveedor->contratos()->sole();
        $this->assertSame('en_ejecucion', $contrato->estado);
        $this->assertSame('2026-12-01', $contrato->fecha_fin_pactada?->toDateString());
        $this->assertSame(1, Evento::where('contrato_id', $contrato->id)->count());
    }

    public function test_invalid_events_are_rejected_with_their_index()
    {
        $proveedor = Proveedor::first();

        $this->post(route('dictamenes.confirmar'), [
            'proveedor_id' => $proveedor->id,
            'contrato_id' => $proveedor->contratos()->value('id'),
            'eventos' => [$this->evento(['tipo' => 'inventado', 'descripcion' => ''])],
        ])->assertSessionHasErrors(['eventos.0.tipo', 'eventos.0.descripcion']);
    }

    public function test_contract_must_belong_to_the_provider()
    {
        $ajeno = Contrato::where('proveedor_id', '!=', Proveedor::first()->id)->first();

        $this->post(route('dictamenes.confirmar'), [
            'proveedor_id' => Proveedor::first()->id,
            'contrato_id' => $ajeno->id,
            'eventos' => [$this->evento()],
        ])->assertSessionHasErrors('contrato_id');
    }
}
