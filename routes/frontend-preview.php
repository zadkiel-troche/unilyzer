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
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

$mock = fn (string $archivo): array => File::json(resource_path("js/mocks/{$archivo}.json"));

/** Indica si el texto contiene todas las claves de una búsqueda de ejemplo. */
$contieneTodas = function (string $texto, array $claves): bool {
    foreach ($claves as $clave) {
        if (! is_string($clave) || ! str_contains($texto, $clave)) {
            return false;
        }
    }

    return true;
};

$normalizar = fn (string $texto): string => Str::of($texto)->ascii()->lower()->toString();

Route::middleware(['auth', 'verified'])->group(function () use ($mock, $normalizar, $contieneTodas) {
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

    Route::post('busqueda', function (Request $request) use ($mock, $normalizar, $contieneTodas) {
        $q = $normalizar((string) $request->input('q'));
        usleep(700_000);

        foreach ($mock('busquedas') as $busqueda) {
            if ($contieneTodas($q, $busqueda['claves'])) {
                return response()->json($busqueda['respuesta']);
            }
        }

        // Simula el fallback por palabras clave sobre nombre, rubro, objeto y descripción.
        $palabras = Str::of($q)->split('/\W+/')->filter(fn (string $p) => strlen($p) > 3);
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

    Route::get('asistente', fn () => Inertia::render('asistente'))->name('asistente.index');

    // Simula AsistenteService: responde con un texto apto para leer en voz alta.
    Route::post('asistente', function (Request $request) use ($mock, $normalizar, $contieneTodas) {
        $mensaje = $normalizar((string) $request->input('mensaje'));
        $listado = collect($mock('listado'));
        $ranking = fn (array $r) => collect($r)->only(['id', 'nombre', 'rubro', 'puntaje', 'semaforo', 'motivo'])->all();
        usleep(900_000);

        $responder = fn (string $texto, array $proveedores = [], array $eventos = [], string $modo = 'ia') => response()->json([
            'modo' => $modo,
            'respuesta' => $texto,
            'proveedores' => array_map($ranking, $proveedores),
            'eventos_citados' => $eventos,
        ]);

        foreach ($mock('historias') as $historia) {
            $claves = collect(explode(' ', $normalizar($historia['proveedor']['nombre'])))
                ->filter(fn ($p) => strlen($p) > 5);

            if ($claves->contains(fn ($p) => str_contains($mensaje, $p))) {
                $resumen = $mock('resumenes')[(string) $historia['proveedor']['id']];
                $texto = preg_replace('/\s*\(eventos? #[^)]*\)/', '', $resumen['resumen']);
                $sugerencia = ['contratar' => 'se puede contratar', 'contratar con condiciones' => 'conviene contratar con condiciones', 'evitar' => 'por ahora conviene evitarlo'][$resumen['recomendacion']];

                return $responder(
                    "{$texto} Según los antecedentes, {$sugerencia}. Su puntaje es {$historia['score']['puntaje']} de 100.",
                    [$listado->firstWhere('id', $historia['proveedor']['id'])],
                    $resumen['eventos_citados'],
                );
            }
        }

        foreach ($mock('busquedas') as $busqueda) {
            if ($contieneTodas($mensaje, $busqueda['claves'])) {
                $r = $busqueda['respuesta'];
                $resultados = array_slice($r['resultados'], 0, 3);
                $nombres = collect($resultados)->map(fn ($x) => "{$x['nombre']}, con {$x['puntaje']} puntos")->join('; ', ' y ');
                $primero = $resultados[0] ?? null;

                return $responder(
                    'Entendí que buscás '.lcfirst($r['interpretacion']).'. '
                        .($primero ? 'Encontré '.count($r['resultados']).": {$nombres}. En el caso de {$primero['nombre']}: ".lcfirst($primero['motivo']).'.' : 'No encontré proveedores que cumplan esas condiciones.'),
                    $resultados,
                    collect($resultados)->flatMap(fn ($x) => array_column($x['eventos_coincidentes'], 'id'))->take(4)->values()->all(),
                );
            }
        }

        if (preg_match('/\b(hola|buenas|ayuda|que podes|que puedes)\b/', $mensaje)) {
            return $responder('Hola, soy el asistente de Unilyzer. Podés preguntarme por un proveedor, por ejemplo Mobiliario del Sur, o pedirme cosas como quién cumplió los plazos pero tuvo problemas de calidad, o cuáles son los mejores proveedores de informática.');
        }

        return $responder(
            'No encontré antecedentes que respondan esa pregunta. Probá nombrando un proveedor o un rubro, por ejemplo obras, limpieza o informática.',
            modo: 'palabras_clave',
        );
    })->name('asistente.responder');
});
