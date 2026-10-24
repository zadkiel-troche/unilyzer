<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\ResumenService;
use App\Services\ProveedorPresenter;
use App\Services\ScoringService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProveedorController extends Controller
{
    public function index(ProveedorPresenter $presenter): Response
    {
        return Inertia::render('proveedores/index', [
            'proveedores' => $presenter->todos()
                ->map(fn (Proveedor $p) => $presenter->resultado($p))
                ->sortByDesc('puntaje')
                ->values(),
        ]);
    }

    public function show(Proveedor $proveedor, ProveedorPresenter $presenter): Response
    {
        return Inertia::render('proveedores/show', $presenter->historia($proveedor));
    }

    public function resumen(Proveedor $proveedor, ResumenService $resumen, ScoringService $scoring): JsonResponse
    {
        $proveedor->load(Proveedor::HISTORIA);

        try {
            return response()->json($resumen->generar($proveedor, $scoring->calcular($proveedor)));
        } catch (AiUnavailableException $e) {
            return response()->json([
                'message' => 'No se pudo generar el resumen con IA: '.lcfirst($e->getMessage()),
            ], 503);
        }
    }
}
