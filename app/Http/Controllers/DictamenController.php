<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dictamenes\ConfirmarDictamenRequest;
use App\Models\Contrato;
use App\Models\Dependencia;
use App\Models\Proveedor;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\ExtractorService;
use App\Services\ProveedorPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DictamenController extends Controller
{
    public function create(ProveedorPresenter $presenter): Response
    {
        return Inertia::render('dictamenes/cargar', [
            'proveedores' => Proveedor::with('contratos:id,proveedor_id,codigo,objeto')
                ->orderBy('nombre')
                ->get()
                ->map(fn (Proveedor $p) => [
                    'id' => $p->id,
                    'nombre' => $p->nombre,
                    'rubro' => $p->rubro,
                    'contratos' => $p->contratos->map(fn (Contrato $c) => $c->only(['id', 'codigo', 'objeto']))->values(),
                ]),
            'dependencias' => Dependencia::orderBy('nombre')->get()
                ->map(fn (Dependencia $d) => $presenter->dependencia($d)),
        ]);
    }

    public function analizar(Request $request, ExtractorService $extractor): JsonResponse
    {
        $validado = $request->validate(['texto' => ['required', 'string', 'min:20', 'max:200000']]);

        try {
            return response()->json($extractor->analizar($validado['texto']));
        } catch (AiUnavailableException $e) {
            return response()->json([
                'message' => 'No se pudo analizar con IA: '.lcfirst($e->getMessage()).' Podés cargar los eventos a mano.',
            ], 503);
        }
    }

    /**
     * Guarda los eventos revisados por el usuario. Crea el proveedor o el
     * contrato si son nuevos. Cada evento conserva su origen (IA o manual).
     */
    public function confirmar(ConfirmarDictamenRequest $request): RedirectResponse
    {
        $datos = $request->validated();
        $proveedorId = $request->filled('proveedor_id') ? $request->integer('proveedor_id') : null;
        $contratoId = $request->filled('contrato_id') ? $request->integer('contrato_id') : null;

        $proveedor = DB::transaction(function () use ($datos, $proveedorId, $contratoId) {
            $proveedor = $proveedorId !== null
                ? Proveedor::findOrFail($proveedorId)
                : Proveedor::create([
                    'nombre' => $datos['proveedor_nuevo']['nombre'],
                    'rubro' => $datos['proveedor_nuevo']['rubro'],
                ]);

            $contrato = $contratoId !== null
                ? $proveedor->contratos()->findOrFail($contratoId)
                : $proveedor->contratos()->create([
                    ...$datos['contrato_nuevo'],
                    'dependencia_id' => $datos['dependencia_id'] ?? null,
                    'estado' => $datos['contrato_nuevo']['estado'] ?? 'en_ejecucion',
                    // Un contrato en ejecución todavía no tiene fecha real de fin.
                    'fecha_fin_real' => ($datos['contrato_nuevo']['estado'] ?? 'en_ejecucion') === 'en_ejecucion'
                        ? null
                        : ($datos['contrato_nuevo']['fecha_fin_real'] ?? null),
                ]);

            if (! empty($datos['evaluacion'])) {
                $contrato->evaluaciones()->create([
                    ...$datos['evaluacion'],
                    'dependencia_id' => $datos['dependencia_id'] ?? null,
                ]);
            }

            $contrato->eventos()->createMany(array_map(fn (array $evento) => [
                ...$evento,
                'documento_origen' => $datos['documento_origen'] ?? null,
            ], $datos['eventos']));

            return $proveedor;
        });

        $cantidad = count($datos['eventos']);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $cantidad === 1
                ? 'Se guardó 1 evento en el historial.'
                : "Se guardaron {$cantidad} eventos en el historial.",
        ]);

        return to_route('proveedores.show', $proveedor);
    }
}
