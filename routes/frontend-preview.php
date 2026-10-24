<?php

/*
|--------------------------------------------------------------------------
| TEMPORAL: rutas de vista previa del frontend (Persona C)
|--------------------------------------------------------------------------
|
| Sirven los mocks de resources/js/mocks con los mismos nombres de ruta y
| las mismas formas JSON de CLAUDE.md §4-§6. Persona A las reemplaza por los
| controladores reales y borra este archivo junto con su `require` en web.php.
|
*/

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

$mock = fn (string $archivo): array => json_decode(
    file_get_contents(resource_path("js/mocks/{$archivo}.json")),
    true,
);

$normalizar = fn (string $texto): string => Str::of($texto)->ascii()->lower()->toString();

Route::middleware(['auth', 'verified'])->group(function () use ($mock, $normalizar) {
    Route::get('dashboard', fn () => Inertia::render('dashboard', $mock('dashboard')))
        ->name('dashboard');

    Route::get('proveedores', fn () => Inertia::render('proveedores/index', [
        'proveedores' => $mock('listado'),
    ]))->name('proveedores.index');

    Route::get('proveedores/{proveedor}', function (int $proveedor) use ($mock) {
        $historia = collect($mock('historias'))->firstWhere('proveedor.id', $proveedor);
        abort_if($historia === null, 404);

        return Inertia::render('proveedores/show', $historia);
    })->name('proveedores.show');

    Route::post('proveedores/{proveedor}/resumen', function (int $proveedor) use ($mock) {
        usleep(900_000);

        return response()->json($mock('resumenes')[(string) $proveedor] ?? abort(404));
    })->name('proveedores.resumen');

    Route::post('busqueda', function (Request $request) use ($mock, $normalizar) {
        $q = $normalizar((string) $request->input('q'));
        usleep(700_000);

        foreach ($mock('busquedas') as $busqueda) {
            if (collect($busqueda['claves'])->every(fn ($clave) => str_contains($q, $clave))) {
                return response()->json($busqueda['respuesta']);
            }
        }

        // Simula el fallback por palabras clave sobre nombre, rubro, objeto y descripción.
        $palabras = collect(preg_split('/\W+/', $q))->filter(fn ($p) => strlen($p) > 3);
        $resultados = collect($mock('historias'))
            ->filter(function ($h) use ($palabras, $normalizar) {
                $texto = $normalizar(implode(' ', [
                    $h['proveedor']['nombre'],
                    $h['proveedor']['rubro'],
                    ...array_column($h['contratos'], 'objeto'),
                    ...array_column($h['timeline'], 'descripcion'),
                ]));

                return $palabras->contains(fn ($p) => str_contains($texto, $p));
            })
            ->map(fn ($h) => collect($mock('listado'))->firstWhere('id', $h['proveedor']['id']))
            ->values();

        return response()->json([
            'modo' => 'palabras_clave',
            'interpretacion' => 'Búsqueda por palabras clave: '.$palabras->implode(', '),
            'filtros' => ['texto' => $request->input('q')],
            'resultados' => $resultados,
        ]);
    })->name('busqueda');

    Route::get('dictamenes/cargar', fn () => Inertia::render('dictamenes/cargar', $mock('catalogos')))
        ->name('dictamenes.create');

    Route::post('dictamenes/analizar', function () use ($mock) {
        usleep(1_200_000);

        return response()->json($mock('extraccion'));
    })->name('dictamenes.analizar');

    Route::post('dictamenes/confirmar', function (Request $request) {
        $eventos = count($request->input('eventos', []));
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Se guardaron {$eventos} eventos en el historial (vista previa).",
        ]);

        return to_route('proveedores.show', $request->integer('proveedor_id') ?: 4);
    })->name('dictamenes.confirmar');
});
