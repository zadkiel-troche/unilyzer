<?php

namespace App\Http\Controllers;

use App\Services\BusquedaPorPalabrasClave;
use App\Services\ProveedorPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AsistenteController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('asistente');
    }

    /**
     * Contrato: resources/js/types/asistente.ts. Sin IA, responde con la
     * búsqueda por palabras clave en un texto apto para leer en voz alta.
     */
    public function responder(Request $request, BusquedaPorPalabrasClave $busqueda, ProveedorPresenter $presenter): JsonResponse
    {
        $validado = $request->validate([
            'mensaje' => ['required', 'string', 'max:1000'],
            'historial' => ['array', 'max:20'],
        ]);

        $coincidencias = $busqueda->coincidencias($busqueda->palabras($validado['mensaje']))->take(3);

        $respuesta = $coincidencias->isEmpty()
            ? 'No encontré antecedentes que respondan esa pregunta. Probá nombrando un proveedor o un rubro, por ejemplo obras, limpieza o informática.'
            : 'Encontré '.$coincidencias->count().' proveedores relacionados: '
                .$coincidencias->map(fn (array $c) => "{$c['proveedor']->nombre}, con {$c['score']['puntaje']} puntos")->join('; ', ' y ')
                .'. Podés abrir su historia clínica para ver el detalle.';

        return response()->json([
            'modo' => 'palabras_clave',
            'respuesta' => $respuesta,
            'proveedores' => $coincidencias->map(fn (array $c) => $presenter->ranking($c['proveedor'], $c['score']))->values(),
            'eventos_citados' => [],
        ]);
    }
}
