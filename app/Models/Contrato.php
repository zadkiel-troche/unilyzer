<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $proveedor_id
 * @property int|null $dependencia_id
 * @property string|null $codigo
 * @property string $objeto
 * @property string|null $monto
 * @property Carbon|null $fecha_inicio
 * @property Carbon|null $fecha_fin_pactada
 * @property Carbon|null $fecha_fin_real
 * @property string $estado
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Proveedor $proveedor
 * @property-read Dependencia|null $dependencia
 * @property-read Collection<int, Evento> $eventos
 * @property-read Collection<int, Evaluacion> $evaluaciones
 */
#[Table('contratos')]
#[Fillable(['proveedor_id', 'dependencia_id', 'codigo', 'objeto', 'monto', 'fecha_inicio', 'fecha_fin_pactada', 'fecha_fin_real', 'estado'])]
class Contrato extends Model
{
    public const ESTADOS = ['en_ejecucion', 'finalizado', 'rescindido'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_fin_pactada' => 'date',
            'fecha_fin_real' => 'date',
        ];
    }

    /**
     * Días de atraso: max(0, fin real − fin pactada). Sin fechas, 0.
     */
    public function diasAtraso(): int
    {
        if ($this->fecha_fin_real === null || $this->fecha_fin_pactada === null) {
            return 0;
        }

        return max(0, (int) $this->fecha_fin_pactada->diffInDays($this->fecha_fin_real, false));
    }

    public function estaCerrado(): bool
    {
        return in_array($this->estado, ['finalizado', 'rescindido'], true);
    }

    /**
     * @return BelongsTo<Proveedor, $this>
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }

    /**
     * @return BelongsTo<Dependencia, $this>
     */
    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class);
    }

    /**
     * @return HasMany<Evento, $this>
     */
    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class);
    }

    /**
     * @return HasMany<Evaluacion, $this>
     */
    public function evaluaciones(): HasMany
    {
        return $this->hasMany(Evaluacion::class);
    }
}
