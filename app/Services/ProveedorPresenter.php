<?php

namespace App\Services;

use App\Models\Contrato;
use App\Models\Dependencia;
use App\Models\Evaluacion;
use App\Models\Evento;
use App\Models\Proveedor;
use Illuminate\Database\Eloquent\Collection;

/**
 * Arma las respuestas con la forma que espera el frontend
 * (resources/js/types/proveedores.ts). Es el único lugar que conoce esas formas.
 */
class ProveedorPresenter
{
    public function __construct(private ScoringService $scoring) {}

    /**
     * Todos los proveedores con su historia cargada (el dataset es chico).
     *
     * @return Collection<int, Proveedor>
     */
    public function todos(): Collection
    {
        return Proveedor::with(Proveedor::HISTORIA)->orderBy('nombre')->get();
    }

    /**
     * Props de proveedores/show (HistoriaClinicaProps).
     *
     * @return array<string, mixed>
     */
    public function historia(Proveedor $proveedor): array
    {
        $proveedor->loadMissing(Proveedor::HISTORIA);

        $timeline = $proveedor->contratos
            ->flatMap(fn (Contrato $c) => $c->eventos->map(fn (Evento $e) => [
                ...$this->evento($e),
                'contrato_codigo' => $c->codigo,
            ]))
            ->sortByDesc(fn (array $e) => $e['fecha'] ?? '')
            ->values()
            ->all();

        return [
            'proveedor' => [
                'id' => $proveedor->id,
                'nombre' => $proveedor->nombre,
                'ruc' => $proveedor->ruc,
                'rubro' => $proveedor->rubro,
                'ficticio' => $proveedor->ficticio,
            ],
            'score' => $this->scoring->calcular($proveedor),
            'contratos' => $proveedor->contratos->map(fn (Contrato $c) => $this->contrato($c))->values()->all(),
            'timeline' => $timeline,
        ];
    }

    /**
     * Fila de búsqueda o listado (ResultadoBusqueda).
     *
     * @param  array<string, mixed>|null  $score
     * @param  iterable<Evento>  $coincidentes
     * @return array<string, mixed>
     */
    public function resultado(Proveedor $proveedor, ?array $score = null, ?string $motivo = null, iterable $coincidentes = []): array
    {
        $score ??= $this->scoring->calcular($proveedor);

        $eventos = [];

        foreach ($coincidentes as $evento) {
            $eventos[] = [
                'id' => $evento->id,
                'tipo' => $evento->tipo,
                'fecha' => $evento->fecha?->toDateString(),
                'descripcion' => $evento->descripcion,
            ];
        }

        return [
            ...$this->ranking($proveedor, $score, $motivo),
            'eventos_coincidentes' => $eventos,
        ];
    }

    /**
     * Fila de ranking (ProveedorRanking).
     *
     * @param  array<string, mixed>|null  $score
     * @return array{id: int, nombre: string, rubro: string, puntaje: int, semaforo: mixed, motivo: string}
     */
    public function ranking(Proveedor $proveedor, ?array $score = null, ?string $motivo = null): array
    {
        $score ??= $this->scoring->calcular($proveedor);

        return [
            'id' => $proveedor->id,
            'nombre' => $proveedor->nombre,
            'rubro' => $proveedor->rubro,
            'puntaje' => $score['puntaje'],
            'semaforo' => $score['semaforo'],
            'motivo' => $motivo ?? $this->motivo($score),
        ];
    }

    /**
     * Resumen legible de las métricas: "3 contratos, 2 multas, satisfacción 2,1/5".
     *
     * @param  array<string, mixed>  $score
     */
    public function motivo(array $score): string
    {
        $m = $score['metricas'];
        $partes = ["{$m['contratos']} contratos"];

        if ($m['contratos_con_atraso'] > 0) {
            $partes[] = "{$m['contratos_con_atraso']} con atraso";
        }

        foreach (['multas' => 'multas', 'reclamos' => 'reclamos', 'observaciones_tecnicas' => 'obs. técnicas'] as $clave => $etiqueta) {
            if ($m[$clave] > 0) {
                $partes[] = "{$m[$clave]} {$etiqueta}";
            }
        }

        if ($m['satisfaccion_promedio'] !== null) {
            $partes[] = 'satisfacción '.self::nota($m['satisfaccion_promedio']);
        }

        return implode(', ', $partes);
    }

    public static function nota(float|int $valor): string
    {
        return number_format((float) $valor, 1, ',', '').'/5';
    }

    /**
     * @return array<string, mixed>
     */
    public function contrato(Contrato $contrato): array
    {
        return [
            'id' => $contrato->id,
            'proveedor_id' => $contrato->proveedor_id,
            'dependencia_id' => $contrato->dependencia_id,
            'codigo' => $contrato->codigo,
            'objeto' => $contrato->objeto,
            'monto' => $contrato->monto === null ? null : (float) $contrato->monto,
            'fecha_inicio' => $contrato->fecha_inicio?->toDateString(),
            'fecha_fin_pactada' => $contrato->fecha_fin_pactada?->toDateString(),
            'fecha_fin_real' => $contrato->fecha_fin_real?->toDateString(),
            'estado' => $contrato->estado,
            'dias_atraso' => $contrato->diasAtraso(),
            'dependencia' => $contrato->dependencia ? $this->dependencia($contrato->dependencia) : null,
            'eventos' => $contrato->eventos->sortBy(fn (Evento $e) => $e->fecha?->toDateString() ?? '')
                ->map(fn (Evento $e) => $this->evento($e))->values()->all(),
            'evaluaciones' => $contrato->evaluaciones->map(fn (Evaluacion $e) => [
                'id' => $e->id,
                'contrato_id' => $e->contrato_id,
                'dependencia_id' => $e->dependencia_id,
                'calidad' => $e->calidad,
                'satisfaccion' => $e->satisfaccion,
                'comentario' => $e->comentario,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function evento(Evento $evento): array
    {
        return [
            'id' => $evento->id,
            'contrato_id' => $evento->contrato_id,
            'tipo' => $evento->tipo,
            'fecha' => $evento->fecha?->toDateString(),
            'dias' => $evento->dias,
            'monto' => $evento->monto === null ? null : (float) $evento->monto,
            'categoria' => $evento->categoria,
            'descripcion' => $evento->descripcion,
            'extracto_fuente' => $evento->extracto_fuente,
            'documento_origen' => $evento->documento_origen,
            'extraido_por_ia' => $evento->extraido_por_ia,
        ];
    }

    /**
     * @return array{id: int, nombre: string, sigla: string|null}
     */
    public function dependencia(Dependencia $dependencia): array
    {
        return ['id' => $dependencia->id, 'nombre' => $dependencia->nombre, 'sigla' => $dependencia->sigla];
    }
}
