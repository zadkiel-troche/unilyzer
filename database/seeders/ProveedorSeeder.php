<?php

namespace Database\Seeders;

use App\Models\Contrato;
use App\Models\Dependencia;
use App\Models\Proveedor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Carga los 10 proveedores ficticios de la demo con sus contratos, eventos y
 * evaluaciones (database/seeders/data/proveedores.php). Es determinista.
 */
class ProveedorSeeder extends Seeder
{
    public function run(): void
    {
        /** @var list<array<string, mixed>> $proveedores */
        $proveedores = require __DIR__.'/data/proveedores.php';
        $dependencias = Dependencia::pluck('id', 'sigla');

        DB::transaction(function () use ($proveedores, $dependencias) {
            foreach ($proveedores as $datos) {
                $proveedor = Proveedor::create([
                    'nombre' => $datos['nombre'],
                    'ruc' => $datos['ruc'],
                    'rubro' => $datos['rubro'],
                    'ficticio' => true,
                ]);

                foreach ($datos['contratos'] as $c) {
                    /** @var Contrato $contrato */
                    $contrato = $proveedor->contratos()->create([
                        'dependencia_id' => $dependencias[$c['dependencia']] ?? null,
                        'codigo' => $c['codigo'],
                        'objeto' => $c['objeto'],
                        'monto' => $c['monto'],
                        'fecha_inicio' => $c['fecha_inicio'],
                        'fecha_fin_pactada' => $c['fecha_fin_pactada'],
                        'fecha_fin_real' => $c['fecha_fin_real'],
                        'estado' => $c['estado'],
                    ]);

                    $contrato->eventos()->createMany($c['eventos']);

                    foreach ($c['evaluaciones'] as $e) {
                        $contrato->evaluaciones()->create([
                            'dependencia_id' => $dependencias[$e['dependencia']] ?? null,
                            'calidad' => $e['calidad'],
                            'satisfaccion' => $e['satisfaccion'],
                            'comentario' => $e['comentario'],
                        ]);
                    }
                }
            }
        });
    }
}
