<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use App\Services\ProveedorPresenter;
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

    public function resumen(Proveedor $proveedor): JsonResponse
    {
        // El ResumenService (IA) llega en el PR de IA.
        return response()->json(['message' => 'El resumen con IA todavía no está disponible.'], 503);
    }
}
