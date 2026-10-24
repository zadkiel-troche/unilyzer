<?php

namespace App\Http\Controllers;

use App\Services\Ai\BusquedaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusquedaController extends Controller
{
    public function __invoke(Request $request, BusquedaService $busqueda): JsonResponse
    {
        $validado = $request->validate(['q' => ['required', 'string', 'max:500']]);

        return response()->json($busqueda->buscar($validado['q']));
    }
}
