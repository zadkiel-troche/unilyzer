<?php

namespace App\Services;

use App\Models\Contrato;
use App\Models\Evento;
use App\Models\Proveedor;

/**
 * Evaluación final explicable del proveedor (CLAUDE.md §4).
 *
 * Cada componente devuelve un puntaje 0-100 y el motivo en texto. El
 * proveedor debe llegar con Proveedor::HISTORIA cargado.
 *
 * @phpstan-type Reincidencia array{tipo: string, categoria: string, contratos: int, veces: int, eventos: list<int>, descripcion: string}
 * @phpstan-type Score array{
 *     puntaje: int,
 *     semaforo: array{nivel: string, etiqueta: string},
 *     componentes: array<string, array{puntaje: int, motivo: string}>,
 *     metricas: array<string, int|float|null>,
 *     reincidencias: list<Reincidencia>,
 * }
 */
class ScoringService
{
    public const PESOS = ['plazos' => 0.35, 'calidad' => 0.35, 'incidencias' => 0.20, 'reincidencia' => 0.10];

    private const PLURALES = [
        'reclamo' => ['reclamo', 'reclamos'],
        'multa' => ['multa', 'multas'],
        'observacion_tecnica' => ['observación técnica', 'observaciones técnicas'],
        'terminacion' => ['terminación', 'terminaciones'],
    ];

    private const ETIQUETAS = [
        'atraso' => 'Atraso',
        'multa' => 'Multa',
        'reclamo' => 'Reclamo',
        'observacion_tecnica' => 'Observación técnica',
        'terminacion' => 'Terminación',
    ];

    /**
     * @return Score
     */
    public function calcular(Proveedor $proveedor): array
    {
        $contratos = $proveedor->contratos;
        $eventos = $contratos->flatMap(fn (Contrato $c) => $c->eventos);
        $evaluaciones = $contratos->flatMap(fn (Contrato $c) => $c->evaluaciones);
        $contar = fn (string $tipo): int => $eventos->where('tipo', $tipo)->count();

        $cerrados = $contratos->filter(fn (Contrato $c) => $c->estaCerrado());
        $conAtraso = $cerrados->filter(
            fn (Contrato $c) => $c->diasAtraso() > 0 || $c->eventos->contains('tipo', 'atraso'),
        );
        $atrasoPromedio = $conAtraso->isEmpty()
            ? 0.0
            : round($conAtraso->sum(fn (Contrato $c) => $c->diasAtraso()) / $conAtraso->count(), 1);

        [$plazos, $motivoPlazos] = $this->plazos($cerrados->count(), $conAtraso->count(), $atrasoPromedio);
        [$calidad, $motivoCalidad] = $this->calidad(array_values($evaluaciones->map(
            fn ($e) => ($e->calidad + $e->satisfaccion) / 2,
        )->all()));

        $reclamos = $contar('reclamo');
        $multas = $contar('multa');
        $observaciones = $contar('observacion_tecnica');
        $terminaciones = $contar('terminacion');
        [$incidencias, $motivoIncidencias] = $this->incidencias($contratos->count(), [
            'reclamo' => $reclamos,
            'multa' => $multas,
            'observacion_tecnica' => $observaciones,
            'terminacion' => $terminaciones,
        ]);

        $reincidencias = $this->reincidencias($proveedor);
        $reincidencia = max(0, 100 - 35 * count($reincidencias));
        $motivoReincidencia = $reincidencias === []
            ? 'Sin reincidencias'
            : count($reincidencias).' patrón(es) repetido(s): '.implode('; ', array_map(
                fn ($r) => str_replace('_', ' ', $r['tipo']).' · '.$r['categoria'],
                $reincidencias,
            ));

        $puntaje = (int) round(
            $plazos * self::PESOS['plazos']
            + $calidad * self::PESOS['calidad']
            + $incidencias * self::PESOS['incidencias']
            + $reincidencia * self::PESOS['reincidencia'],
        );

        $promedio = fn (string $campo): ?float => $evaluaciones->isEmpty()
            ? null
            : round($evaluaciones->avg($campo), 1);

        return [
            'puntaje' => $puntaje,
            'semaforo' => self::semaforo($puntaje),
            'componentes' => [
                'plazos' => ['puntaje' => (int) round($plazos), 'motivo' => $motivoPlazos],
                'calidad' => ['puntaje' => (int) round($calidad), 'motivo' => $motivoCalidad],
                'incidencias' => ['puntaje' => (int) round($incidencias), 'motivo' => $motivoIncidencias],
                'reincidencia' => ['puntaje' => $reincidencia, 'motivo' => $motivoReincidencia],
            ],
            'metricas' => [
                'contratos' => $contratos->count(),
                'finalizados' => $contratos->where('estado', 'finalizado')->count(),
                'rescindidos' => $contratos->where('estado', 'rescindido')->count(),
                'monto_total' => (float) $contratos->sum(fn (Contrato $c) => (float) $c->monto),
                'contratos_con_atraso' => $conAtraso->count(),
                'atraso_promedio_dias' => $atrasoPromedio,
                'atrasos' => $contar('atraso'),
                'multas' => $multas,
                'monto_multas' => (float) $eventos->where('tipo', 'multa')->sum(fn (Evento $e) => (float) $e->monto),
                'reclamos' => $reclamos,
                'observaciones_tecnicas' => $observaciones,
                'prorrogas' => $contar('prorroga'),
                'ampliaciones' => $contar('ampliacion'),
                'terminaciones' => $terminaciones,
                'calidad_promedio' => $promedio('calidad'),
                'satisfaccion_promedio' => $promedio('satisfaccion'),
            ],
            'reincidencias' => $reincidencias,
        ];
    }

    /**
     * @return array{nivel: string, etiqueta: string}
     */
    public static function semaforo(int $puntaje): array
    {
        return match (true) {
            $puntaje >= 75 => ['nivel' => 'verde', 'etiqueta' => 'Confiable'],
            $puntaje >= 50 => ['nivel' => 'amarillo', 'etiqueta' => 'Con observaciones'],
            default => ['nivel' => 'rojo', 'etiqueta' => 'Crítico'],
        };
    }

    /**
     * % de contratos cerrados sin atraso; −15 si el atraso promedio supera 30 días.
     *
     * @return array{float, string}
     */
    private function plazos(int $cerrados, int $conAtraso, float $atrasoPromedio): array
    {
        if ($cerrados === 0) {
            return [70.0, 'Sin contratos cerrados: valor neutro'];
        }

        $puntaje = 100 * ($cerrados - $conAtraso) / $cerrados;
        $motivo = ($cerrados - $conAtraso)." de {$cerrados} contratos cerrados sin atraso";

        if ($atrasoPromedio > 30) {
            $puntaje -= 15;
            $motivo .= '; −15 por atraso promedio de '.self::numero($atrasoPromedio).' días';
        }

        return [max(0.0, $puntaje), $motivo];
    }

    /**
     * Promedio de (calidad + satisfacción) / 2, escalado de 1-5 a 0-100.
     *
     * @param  list<float|int>  $notas
     * @return array{float, string}
     */
    private function calidad(array $notas): array
    {
        if ($notas === []) {
            return [60.0, 'Sin evaluaciones: valor neutro'];
        }

        $promedio = array_sum($notas) / count($notas);

        return [
            ($promedio - 1) / 4 * 100,
            sprintf('Promedio de calidad y satisfacción %.1f/5 en %d evaluaciones', $promedio, count($notas)),
        ];
    }

    /**
     * 100 − 2 × (reclamos·12 + multas·15 + observaciones·8 + terminaciones·50) / contratos.
     *
     * @param  array<string, int>  $conteos
     * @return array{float, string}
     */
    private function incidencias(int $contratos, array $conteos): array
    {
        if ($contratos === 0) {
            return [100.0, 'Sin incidencias registradas'];
        }

        $penalidad = $conteos['reclamo'] * 12 + $conteos['multa'] * 15
            + $conteos['observacion_tecnica'] * 8 + $conteos['terminacion'] * 50;

        $partes = [];

        foreach ($conteos as $tipo => $cantidad) {
            if ($cantidad > 0) {
                [$singular, $plural] = self::PLURALES[$tipo];
                $partes[] = "{$cantidad} ".($cantidad === 1 ? $singular : $plural);
            }
        }

        return [
            max(0.0, 100 - 2 * $penalidad / $contratos),
            $partes === [] ? 'Sin incidencias registradas' : implode(', ', $partes)." en {$contratos} contratos",
        ];
    }

    /**
     * Mismo tipo + categoría negativo en 2 o más contratos distintos.
     *
     * @return list<Reincidencia>
     */
    public function reincidencias(Proveedor $proveedor): array
    {
        $grupos = [];

        foreach ($proveedor->contratos as $contrato) {
            foreach ($contrato->eventos as $evento) {
                if ($evento->esNegativo() && $evento->categoria !== null) {
                    $grupos["{$evento->tipo}|{$evento->categoria}"][] = $evento;
                }
            }
        }

        $reincidencias = [];

        foreach ($grupos as $clave => $eventos) {
            $contratos = count(array_unique(array_map(fn (Evento $e) => $e->contrato_id, $eventos)));

            if ($contratos < 2) {
                continue;
            }

            [$tipo, $categoria] = explode('|', $clave);
            $reincidencias[] = [
                'tipo' => $tipo,
                'categoria' => $categoria,
                'contratos' => $contratos,
                'veces' => count($eventos),
                'eventos' => array_map(fn (Evento $e) => $e->id, $eventos),
                'descripcion' => self::ETIQUETAS[$tipo]." por {$categoria} en {$contratos} contratos distintos",
            ];
        }

        return $reincidencias;
    }

    private static function numero(float $valor): string
    {
        return rtrim(rtrim(number_format($valor, 1, '.', ''), '0'), '.');
    }
}
