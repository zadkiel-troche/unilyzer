<?php

namespace App\Services\Ai;

use App\Models\Contrato;
use App\Models\Dependencia;
use App\Models\Evento;
use App\Models\Proveedor;
use App\Services\BusquedaPorPalabrasClave;
use App\Services\ProveedorPresenter;
use App\Services\ScoringService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Búsqueda en lenguaje natural (CLAUDE.md §5.A): la IA traduce la pregunta a
 * filtros, Laravel los valida contra los catálogos reales y los aplica. Si la
 * IA no está disponible, se busca por palabras clave.
 *
 * @phpstan-import-type Score from ScoringService
 *
 * @phpstan-type Filtros array{
 *     texto: string|null, nombre: string|null, rubro: string|null, dependencia: string|null,
 *     tipos_evento: list<string>|null, categoria: string|null, desde: string|null,
 *     hasta: string|null, sin_atrasos: bool|null, satisfaccion_max: float|null,
 *     puntaje_min: int|null, puntaje_max: int|null, solo_reincidentes: bool|null,
 *     orden: string|null, limite: int,
 * }
 */
class BusquedaService
{
    public const ORDENES = ['puntaje_asc', 'puntaje_desc', 'incidencias_desc'];

    private const LIMITE_POR_DEFECTO = 10;

    private const PLURALES = [
        'atraso' => ['atraso', 'atrasos'],
        'multa' => ['multa', 'multas'],
        'prorroga' => ['prórroga', 'prórrogas'],
        'reclamo' => ['reclamo', 'reclamos'],
        'observacion_tecnica' => ['observación técnica', 'observaciones técnicas'],
        'ampliacion' => ['ampliación', 'ampliaciones'],
        'terminacion' => ['terminación', 'terminaciones'],
        'cambio_administrativo' => ['cambio administrativo', 'cambios administrativos'],
        'recepcion_conforme' => ['recepción conforme', 'recepciones conformes'],
    ];

    public function __construct(
        private OpenAiClient $ia,
        private ScoringService $scoring,
        private ProveedorPresenter $presenter,
        private BusquedaPorPalabrasClave $palabrasClave,
    ) {}

    /**
     * @return array{modo: string, interpretacion: string, filtros: array<string, mixed>, resultados: list<array<string, mixed>>}
     */
    public function buscar(string $consulta): array
    {
        try {
            ['interpretacion' => $interpretacion, 'filtros' => $filtros] = $this->interpretar($consulta);
        } catch (AiUnavailableException) {
            return $this->palabrasClave->buscar($consulta);
        }

        return [
            'modo' => 'ia',
            'interpretacion' => $interpretacion,
            'filtros' => $filtros,
            'resultados' => $this->aplicar($filtros),
        ];
    }

    /**
     * Pide a la IA la interpretación y los filtros, y los valida.
     *
     * @return array{interpretacion: string, filtros: Filtros}
     *
     * @throws AiUnavailableException
     */
    public function interpretar(string $consulta): array
    {
        $catalogo = $this->catalogo();
        $respuesta = $this->ia->json($this->prompt($catalogo), $consulta, 'busqueda_proveedores', $this->esquema($catalogo));

        $filtros = $this->validar(is_array($respuesta['filtros'] ?? null) ? $respuesta['filtros'] : [], $catalogo);

        if ($filtros['nombre'] === null) {
            $inferido = $this->inferirNombre($consulta, $catalogo);
            if ($inferido !== null) {
                $filtros['nombre'] = $inferido;
            }
        }

        return [
            'interpretacion' => is_string($respuesta['interpretacion'] ?? null) ? $respuesta['interpretacion'] : $consulta,
            'filtros' => $filtros,
        ];
    }

    /**
     * Aplica los filtros sobre los proveedores y su puntaje calculado.
     *
     * @param  Filtros  $filtros
     * @return list<array<string, mixed>>
     */
    public function aplicar(array $filtros): array
    {
        $filas = $this->presenter->todos()
            ->map(fn (Proveedor $p) => $this->evaluar($p, $filtros))
            ->filter()
            ->values();

        $filas = match ($filtros['orden']) {
            'puntaje_asc' => $filas->sortBy(fn (array $f) => $f['score']['puntaje']),
            'incidencias_desc' => $filas->sortByDesc(fn (array $f) => $f['incidencias']),
            default => $filas->sortByDesc(fn (array $f) => $f['score']['puntaje']),
        };

        return array_values($filas
            ->take($filtros['limite'])
            ->map(fn (array $f) => $this->presenter->resultado($f['proveedor'], $f['score'], $f['motivo'], $f['eventos']))
            ->all());
    }

    /**
     * Decide si el proveedor cumple los filtros y arma su motivo.
     *
     * @param  Filtros  $filtros
     * @return array{proveedor: Proveedor, score: Score, eventos: list<Evento>, incidencias: int, motivo: string}|null
     */
    private function evaluar(Proveedor $proveedor, array $filtros): ?array
    {
        if ($filtros['nombre'] !== null && ! $this->nombreCoincide($proveedor->nombre, $filtros['nombre'])) {
            return null;
        }

        if ($filtros['rubro'] !== null && $proveedor->rubro !== $filtros['rubro']) {
            return null;
        }

        if ($filtros['dependencia'] !== null && ! $proveedor->contratos->contains(
            fn (Contrato $c) => $c->dependencia?->nombre === $filtros['dependencia'],
        )) {
            return null;
        }

        $todos = $proveedor->contratos->flatMap(fn (Contrato $c) => $c->eventos);
        $textoComoNombre = $filtros['texto'] !== null && $this->nombreCoincide($proveedor->nombre, $filtros['texto']);
        $filtraEventos = $filtros['tipos_evento'] !== null || $filtros['categoria'] !== null
            || $filtros['desde'] !== null || $filtros['hasta'] !== null
            || ($filtros['texto'] !== null && ! $textoComoNombre);
        $coincidentes = $todos->filter(fn (Evento $e) => $this->eventoCoincide($e, $filtros, $textoComoNombre))->values();

        if ($filtraEventos && $coincidentes->isEmpty()) {
            return null;
        }

        $score = $this->scoring->calcular($proveedor);
        $m = $score['metricas'];

        if ($filtros['sin_atrasos'] === true && $m['contratos_con_atraso'] > 0) {
            return null;
        }

        if ($filtros['satisfaccion_max'] !== null
            && ($m['satisfaccion_promedio'] === null || $m['satisfaccion_promedio'] > $filtros['satisfaccion_max'])) {
            return null;
        }

        if (($filtros['puntaje_min'] !== null && $score['puntaje'] < $filtros['puntaje_min'])
            || ($filtros['puntaje_max'] !== null && $score['puntaje'] > $filtros['puntaje_max'])) {
            return null;
        }

        $reincidencias = array_values(array_filter($score['reincidencias'], fn (array $r) => ($filtros['tipos_evento'] === null || in_array($r['tipo'], $filtros['tipos_evento'], true))
            && ($filtros['categoria'] === null || $r['categoria'] === $filtros['categoria'])));

        if ($filtros['solo_reincidentes'] === true && $reincidencias === []) {
            return null;
        }

        // Sin filtros por evento, la evidencia son sus incidencias registradas.
        $evidencia = $filtraEventos ? $coincidentes : $todos->filter(fn (Evento $e) => $e->esNegativo())->values();

        return [
            'proveedor' => $proveedor,
            'score' => $score,
            'eventos' => array_values($evidencia->sortByDesc(fn (Evento $e) => $e->fecha?->toDateString() ?? '')->all()),
            'incidencias' => $todos->filter(fn (Evento $e) => $e->esNegativo())->count(),
            'motivo' => $this->motivo($filtros, $coincidentes, $score, $reincidencias, $filtraEventos),
        ];
    }

    /**
     * @param  Filtros  $filtros
     */
    private function eventoCoincide(Evento $evento, array $filtros, bool $textoComoNombre = false): bool
    {
        $fecha = $evento->fecha?->toDateString();

        return ($filtros['tipos_evento'] === null || in_array($evento->tipo, $filtros['tipos_evento'], true))
            && ($filtros['categoria'] === null || $evento->categoria === $filtros['categoria'])
            && ($filtros['desde'] === null || ($fecha !== null && $fecha >= $filtros['desde']))
            && ($filtros['hasta'] === null || ($fecha !== null && $fecha <= $filtros['hasta']))
            && ($filtros['texto'] === null || $textoComoNombre || str_contains(
                BusquedaPorPalabrasClave::normalizar($evento->descripcion),
                BusquedaPorPalabrasClave::normalizar($filtros['texto']),
            ));
    }

    private function nombreCoincide(string $nombreProveedor, string $fragmento): bool
    {
        return str_contains(
            BusquedaPorPalabrasClave::normalizar($nombreProveedor),
            BusquedaPorPalabrasClave::normalizar($fragmento),
        );
    }

    /**
     * Si la IA no devolvió nombre, detecta el token de la consulta que mejor identifica proveedores.
     *
     * @param  array{rubros: list<string>, dependencias: list<string>, nombres: list<string>}  $catalogo
     */
    private function inferirNombre(string $consulta, array $catalogo): ?string
    {
        $rubrosNorm = collect($catalogo['rubros'])
            ->flatMap(fn (string $rubro) => [
                BusquedaPorPalabrasClave::normalizar($rubro),
                BusquedaPorPalabrasClave::normalizar(str_replace('_', ' ', $rubro)),
            ])
            ->unique()
            ->all();

        $palabras = $this->palabrasClave->palabras($consulta)
            ->reject(fn (string $p) => in_array($p, $rubrosNorm, true));

        if ($palabras->isEmpty()) {
            return null;
        }

        $proveedores = $this->presenter->todos();
        $mejor = null;
        $menorCantidad = PHP_INT_MAX;

        foreach ($palabras as $palabra) {
            $cantidad = $proveedores->filter(
                fn (Proveedor $p) => str_contains(BusquedaPorPalabrasClave::normalizar($p->nombre), $palabra),
            )->count();

            if ($cantidad > 0 && $cantidad < $menorCantidad) {
                $menorCantidad = $cantidad;
                $mejor = $palabra;
            }
        }

        return $mejor;
    }

    /**
     * Motivo armado en PHP con lo que hizo coincidir: "2 multas desde 2024, satisfacción 2,0/5".
     *
     * @param  Filtros  $filtros
     * @param  Collection<int, Evento>  $coincidentes
     * @param  Score  $score
     * @param  list<array<string, mixed>>  $reincidencias
     */
    private function motivo(array $filtros, Collection $coincidentes, array $score, array $reincidencias, bool $filtraEventos): string
    {
        $m = $score['metricas'];
        $partes = [];

        if ($filtraEventos) {
            $desde = $filtros['desde'] !== null ? ' desde '.substr($filtros['desde'], 0, 4) : '';

            foreach ($coincidentes->countBy('tipo') as $tipo => $cantidad) {
                [$singular, $plural] = self::PLURALES[$tipo] ?? [$tipo, $tipo];
                $partes[] = "{$cantidad} ".($cantidad === 1 ? $singular : $plural).$desde;
            }
        }

        if ($filtros['sin_atrasos'] === true) {
            $partes[] = "0 atrasos en {$m['contratos']} contratos";
        }

        if ($filtros['solo_reincidentes'] === true && $reincidencias !== []) {
            $partes[] = 'reincide: '.mb_strtolower((string) $reincidencias[0]['descripcion']);
        }

        if ($filtros['satisfaccion_max'] !== null && $m['satisfaccion_promedio'] !== null) {
            $partes[] = 'satisfacción '.ProveedorPresenter::nota($m['satisfaccion_promedio']);

            // Si ya se contaron eventos que coinciden, no se repiten acá.
            if (! $filtraEventos && $m['observaciones_tecnicas'] > 0) {
                [$singular, $plural] = self::PLURALES['observacion_tecnica'];
                $partes[] = "{$m['observaciones_tecnicas']} ".($m['observaciones_tecnicas'] === 1 ? $singular : $plural);
            }
        }

        return $partes === [] ? $this->presenter->motivo($score) : ucfirst(implode(', ', $partes));
    }

    /**
     * Descarta lo que no esté en los catálogos reales.
     *
     * @param  array<string, mixed>  $f
     * @param  array{rubros: list<string>, dependencias: list<string>, nombres: list<string>}  $catalogo
     * @return Filtros
     */
    public function validar(array $f, array $catalogo): array
    {
        $texto = fn (string $clave): ?string => is_string($f[$clave] ?? null) && trim($f[$clave]) !== '' ? trim($f[$clave]) : null;
        $fecha = function (string $clave) use ($texto): ?string {
            $valor = $texto($clave);

            return $valor !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) && Carbon::canBeCreatedFromFormat($valor, 'Y-m-d') ? $valor : null;
        };
        $entero = fn (string $clave, int $min, int $max): ?int => is_numeric($f[$clave] ?? null)
            ? max($min, min($max, (int) $f[$clave]))
            : null;

        $tipos = is_array($f['tipos_evento'] ?? null)
            ? array_values(array_intersect($f['tipos_evento'], Evento::TIPOS))
            : [];

        $nombre = $texto('nombre');
        if ($nombre !== null && $this->fragmentoEsRubro($nombre, $catalogo['rubros'])) {
            $nombre = null;
        }

        return [
            'texto' => $texto('texto'),
            'nombre' => $nombre,
            'rubro' => in_array($f['rubro'] ?? null, $catalogo['rubros'], true) ? $f['rubro'] : null,
            'dependencia' => in_array($f['dependencia'] ?? null, $catalogo['dependencias'], true) ? $f['dependencia'] : null,
            'tipos_evento' => $tipos === [] ? null : $tipos,
            'categoria' => in_array($f['categoria'] ?? null, Evento::CATEGORIAS, true) ? $f['categoria'] : null,
            'desde' => $fecha('desde'),
            'hasta' => $fecha('hasta'),
            'sin_atrasos' => ($f['sin_atrasos'] ?? null) === true ? true : null,
            'satisfaccion_max' => is_numeric($f['satisfaccion_max'] ?? null) ? max(1.0, min(5.0, (float) $f['satisfaccion_max'])) : null,
            'puntaje_min' => $entero('puntaje_min', 0, 100),
            'puntaje_max' => $entero('puntaje_max', 0, 100),
            'solo_reincidentes' => ($f['solo_reincidentes'] ?? null) === true ? true : null,
            'orden' => in_array($f['orden'] ?? null, self::ORDENES, true) ? $f['orden'] : null,
            'limite' => $entero('limite', 1, 20) ?? self::LIMITE_POR_DEFECTO,
        ];
    }

    /**
     * Valores reales de la base que la IA puede usar.
     *
     * @return array{rubros: list<string>, dependencias: list<string>, nombres: list<string>}
     */
    public function catalogo(): array
    {
        return [
            'rubros' => array_values(Proveedor::query()->distinct()->orderBy('rubro')->pluck('rubro')->all()),
            'dependencias' => array_values(Dependencia::query()->orderBy('nombre')->pluck('nombre')->all()),
            'nombres' => array_values(Proveedor::query()->orderBy('nombre')->pluck('nombre')->all()),
        ];
    }

    /**
     * @param  list<string>  $rubros
     */
    private function fragmentoEsRubro(string $fragmento, array $rubros): bool
    {
        $norm = BusquedaPorPalabrasClave::normalizar($fragmento);

        foreach ($rubros as $rubro) {
            if ($norm === BusquedaPorPalabrasClave::normalizar($rubro)
                || $norm === BusquedaPorPalabrasClave::normalizar(str_replace('_', ' ', $rubro))) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array{rubros: list<string>, dependencias: list<string>, nombres: list<string>}  $catalogo
     */
    private function prompt(array $catalogo): string
    {
        $hoy = now()->toDateString();
        $lista = fn (array $valores): string => implode(', ', $valores);

        return <<<PROMPT
        Sos el motor de búsqueda de Unilyzer, una plataforma que guarda la historia clínica de los proveedores de una universidad pública.
        Convertí la pregunta del usuario en filtros. Hoy es {$hoy}.

        Valores permitidos (usá exactamente estos textos; si no corresponde ninguno, null):
        - rubro: {$lista($catalogo['rubros'])}
        - dependencia: {$lista($catalogo['dependencias'])}
        - proveedores registrados (para el filtro nombre): {$lista($catalogo['nombres'])}
        - tipos_evento: {$lista(Evento::TIPOS)}
        - categoria: {$lista(Evento::CATEGORIAS)}
        - orden: puntaje_asc (peores primero), puntaje_desc (mejores primero), incidencias_desc (más incidencias primero)

        Reglas:
        - "interpretacion": una frase corta que describa qué se va a mostrar, por ejemplo
          "Proveedores del rubro obras con al menos una multa por atraso desde 2024". No empieces con "El usuario".
        - "multas por atraso" → tipos_evento ["multa"] y categoria "plazo".
        - "cumplió los plazos" / "sin atrasos" → sin_atrasos true.
        - "problemas de calidad" / "baja satisfacción" → satisfaccion_max 3 y orden puntaje_asc.
          NO uses categoria "calidad" para eso: la calidad se mide con la satisfacción y las observaciones técnicas.
        - categoria solo si la pregunta nombra un motivo concreto de los eventos (por ejemplo "por atraso", "por seguridad", "por materiales").
        - "repetidos", "reincidentes", "varias veces" → solo_reincidentes true.
        - "los mejores" → orden puntaje_desc; "los peores" o "más problemáticos" → puntaje_asc.
        - "desde 2024" → desde "2024-01-01". Fechas siempre en formato YYYY-MM-DD.
        - nombre: fragmento del nombre de un proveedor (completo o parcial, por ejemplo "Paraná", "TecnoSur", "Mobiliario del Sur").
          Usalo cuando la pregunta nombra o apunta a un proveedor concreto; se puede combinar con otros filtros (por ejemplo "multas de Paraná" → nombre "Paraná" y tipos_evento ["multa"]).
          No uses nombre si solo mencionan un rubro ("informática", "obras").
        - texto: solo para palabras concretas a buscar en las descripciones de eventos que no encajen en otro filtro; no uses texto para nombres de proveedor (usá nombre).
        - Si un filtro no se menciona, null. limite: 10 salvo que pidan otra cantidad.
        PROMPT;
    }

    /**
     * @param  array{rubros: list<string>, dependencias: list<string>, nombres: list<string>}  $catalogo
     * @return array<string, mixed>
     */
    private function esquema(array $catalogo): array
    {
        return Esquema::objeto([
            'interpretacion' => Esquema::texto(),
            'filtros' => Esquema::objeto([
                'texto' => Esquema::texto(nullable: true),
                'nombre' => Esquema::texto(nullable: true),
                'rubro' => Esquema::enum($catalogo['rubros'], nullable: true),
                'dependencia' => Esquema::enum($catalogo['dependencias'], nullable: true),
                'tipos_evento' => Esquema::lista(Esquema::enum(Evento::TIPOS), nullable: true),
                'categoria' => Esquema::enum(Evento::CATEGORIAS, nullable: true),
                'desde' => Esquema::texto(nullable: true, descripcion: 'YYYY-MM-DD'),
                'hasta' => Esquema::texto(nullable: true, descripcion: 'YYYY-MM-DD'),
                'sin_atrasos' => Esquema::booleano(nullable: true),
                'satisfaccion_max' => Esquema::numero(nullable: true),
                'puntaje_min' => Esquema::entero(nullable: true),
                'puntaje_max' => Esquema::entero(nullable: true),
                'solo_reincidentes' => Esquema::booleano(nullable: true),
                'orden' => Esquema::enum(self::ORDENES, nullable: true),
                'limite' => Esquema::entero(nullable: true),
            ]),
        ]);
    }
}
