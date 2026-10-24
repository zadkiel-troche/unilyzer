<?php

namespace App\Http\Controllers;

use App\Services\Ai\AsistenteService;
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
     * Contrato: resources/js/types/asistente.ts.
     */
    public function responder(Request $request, AsistenteService $asistente): JsonResponse
    {
        $validado = $request->validate([
            'mensaje' => ['required', 'string', 'max:1000'],
            'historial' => ['array', 'max:20'],
            'historial.*.rol' => ['required', 'in:usuario,asistente'],
            'historial.*.texto' => ['required', 'string', 'max:4000'],
        ]);

        return response()->json($asistente->responder(
            $validado['mensaje'],
            array_values($validado['historial'] ?? []),
        ));
    }
}
