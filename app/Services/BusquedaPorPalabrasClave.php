<?php

namespace App\Services;

use App\Models\Contrato;
use App\Models\Evento;
use App\Models\Proveedor;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Búsqueda sin IA (CLAUDE.md §5.A, fallback): busca las palabras de la
 * consulta en el nombre, el rubro, el objeto de los contratos y la
 * descripción de los eventos. No distingue mayúsculas ni tildes.
 *
 * @phpstan-import-type Score from ScoringService
 */
class BusquedaPorPalabrasClave
{
    /** Palabras que no aportan a la búsqueda. */
    private const IGNORADAS = [
        'proveedor', 'proveedores', 'quien', 'quienes', 'cual', 'cuales', 'cuantos', 'tuvo', 'tuvieron',
        'tienen', 'tiene', 'para', 'desde', 'hasta', 'entre', 'sobre', 'pero', 'como', 'donde', 'mejores',
        'peores', 'mejor', 'peor', 'todos', 'todas', 'esta', 'este', 'estos', 'estas', 'hubo', 'fueron',
    ];

    public function __construct(
        private ProveedorPresenter $presenter,
        private ScoringService $scoring,
    ) {}

    /**
     * Respuesta con la forma de BusquedaRespuesta, en modo "palabras_clave".
     *
     * @return array{modo: string, interpretacion: string, filtros: array<string, mixed>, resultados: list<array<string, mixed>>}
     */
    public function buscar(string $consulta): array
    {
        $palabras = $this->palabras($consulta);

        return [
            'modo' => 'palabras_clave',
            'interpretacion' => $palabras->isEmpty()
                ? 'No encontré palabras clave en la consulta.'
                : 'Búsqueda por palabras clave: '.$palabras->implode(', '),
            'filtros' => ['texto' => $consulta],
            'resultados' => array_values($this->coincidencias($palabras)
                ->map(fn (array $c) => $this->presenter->resultado($c['proveedor'], $c['score'], null, $c['eventos']))
                ->all()),
        ];
    }

    /**
     * Proveedores que coinciden, con su puntaje y los eventos que hicieron coincidir.
     *
     * @param  Collection<int, string>  $palabras
     * @return Collection<int, array{proveedor: Proveedor, score: Score, eventos: list<Evento>}>
     */
    public function coincidencias(Collection $palabras): Collection
    {
        if ($palabras->isEmpty()) {
            return collect();
        }

        $contiene = fn (?string $texto): bool => $texto !== null
            && $palabras->contains(fn (string $p) => str_contains(self::normalizar($texto), $p));

        return $this->presenter->todos()
            ->map(function (Proveedor $proveedor) use ($contiene) {
                $eventos = array_values($proveedor->contratos
                    ->flatMap(fn (Contrato $c) => $c->eventos)
                    ->filter(fn (Evento $e) => $contiene($e->descripcion))
                    ->all());

                $coincide = $eventos !== []
                    || $contiene($proveedor->nombre)
                    || $contiene(str_replace('_', ' ', $proveedor->rubro))
                    || $proveedor->contratos->contains(fn (Contrato $c) => $contiene($c->objeto));

                return $coincide
                    ? ['proveedor' => $proveedor, 'score' => $this->scoring->calcular($proveedor), 'eventos' => $eventos]
                    : null;
            })
            ->filter()
            ->sortByDesc(fn (array $c) => count($c['eventos']))
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    public function palabras(string $consulta): Collection
    {
        return Str::of(self::normalizar($consulta))
            ->split('/[^a-z0-9]+/')
            ->filter(fn (string $p): bool => self::esPalabraUtil($p))
            ->unique()
            ->values();
    }

    private static function esPalabraUtil(string $palabra): bool
    {
        return strlen($palabra) > 3 && ! in_array($palabra, self::IGNORADAS, true);
    }

    public static function normalizar(string $texto): string
    {
        return Str::of($texto)->ascii()->lower()->toString();
    }
}
