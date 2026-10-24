<?php

namespace App\Services;

use App\Models\Contrato;
use App\Models\Dependencia;

/**
 * Agregados para preguntas del tipo "¿qué dependencias tienen más
 * contratos?" o "¿cuántos contratos hay en ejecución?".
 *
 * @phpstan-type PorEstado array{en_ejecucion: int, finalizado: int, rescindido: int}
 * @phpstan-type FilaDependencia array{id: int, nombre: string, sigla: string|null, contratos: int, proveedores: int, monto_total: float, por_estado: PorEstado}
 */
class EstadisticasService
{
    /**
     * Una fila por dependencia, de la que tiene más contratos a la que tiene menos.
     *
     * @return list<FilaDependencia>
     */
    public function porDependencia(): array
    {
        $contratos = Contrato::query()
            ->whereNotNull('dependencia_id')
            ->get(['dependencia_id', 'proveedor_id', 'estado', 'monto'])
            ->groupBy('dependencia_id');

        $filas = Dependencia::query()->orderBy('nombre')->get()->map(function (Dependencia $d) use ($contratos) {
            $propios = $contratos->get($d->id, collect());

            return [
                'id' => $d->id,
                'nombre' => $d->nombre,
                'sigla' => $d->sigla,
                'contratos' => $propios->count(),
                'proveedores' => $propios->pluck('proveedor_id')->unique()->count(),
                'monto_total' => (float) $propios->sum(fn (Contrato $c) => (float) $c->monto),
                'por_estado' => $this->contarEstados($propios->pluck('estado')->all()),
            ];
        });

        return array_values($filas->sortByDesc('contratos')->all());
    }

    /**
     * Contratos de toda la institución por estado.
     *
     * @return PorEstado
     */
    public function contratosPorEstado(): array
    {
        return $this->contarEstados(Contrato::query()->pluck('estado')->all());
    }

    /**
     * @param  array<int, string>  $estados
     * @return PorEstado
     */
    private function contarEstados(array $estados): array
    {
        $conteo = array_count_values($estados);

        return [
            'en_ejecucion' => $conteo['en_ejecucion'] ?? 0,
            'finalizado' => $conteo['finalizado'] ?? 0,
            'rescindido' => $conteo['rescindido'] ?? 0,
        ];
    }
}
