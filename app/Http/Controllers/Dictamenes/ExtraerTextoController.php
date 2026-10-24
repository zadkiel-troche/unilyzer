<?php

namespace App\Http\Controllers\Dictamenes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dictamenes\ExtraerTextoRequest;
use App\Services\Documentos\DocumentoNoLegibleException;
use App\Services\Documentos\ExtractorTextoDocumento;
use Illuminate\Http\JsonResponse;

/**
 * Convierte el documento subido en texto para revisarlo antes de analizarlo.
 * No guarda el archivo.
 */
class ExtraerTextoController extends Controller
{
    public function __invoke(ExtraerTextoRequest $request, ExtractorTextoDocumento $extractor): JsonResponse
    {
        $archivo = $request->file('archivo');

        try {
            $texto = $extractor->extraer($archivo);
        } catch (DocumentoNoLegibleException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'texto' => $texto,
            'documento' => pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME),
            'formato' => strtolower($archivo->getClientOriginalExtension()),
            'caracteres' => mb_strlen($texto),
        ]);
    }
}
