<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use App\Services\ProveedorPresenter;
use App\Services\ScoringService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(ProveedorPresenter $presenter, ScoringService $scoring): Response
    {
        $proveedores = $presenter->todos();
        $filas = $proveedores
            ->map(function (Proveedor $p) use ($presenter, $scoring) {
                $score = $scoring->calcular($p);

                return ['fila' => $presenter->ranking($p, $score), 'metricas' => $score['metricas']];
            })
            ->sortBy(fn (array $f) => $f['fila']['puntaje'])
            ->values();

        return Inertia::render('dashboard', [
            'kpis' => [
                'proveedores' => $proveedores->count(),
                'contratos' => (int) $filas->sum(fn (array $f) => $f['metricas']['contratos']),
                'monto_total' => (float) $filas->sum(fn (array $f) => $f['metricas']['monto_total']),
                'reclamos' => (int) $filas->sum(fn (array $f) => $f['metricas']['reclamos']),
            ],
            'criticos' => $filas->take(5)->pluck('fila')->values(),
            'confiables' => $filas->reverse()->take(5)->pluck('fila')->values(),
        ]);
    }
}
