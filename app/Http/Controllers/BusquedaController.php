<?php

namespace App\Http\Controllers;

use App\Services\BusquedaPorPalabrasClave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusquedaController extends Controller
{
    public function __invoke(Request $request, BusquedaPorPalabrasClave $busqueda): JsonResponse
    {
        $validado = $request->validate(['q' => ['required', 'string', 'max:500']]);

        return response()->json($busqueda->buscar($validado['q']));
    }
}
