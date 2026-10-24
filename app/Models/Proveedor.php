<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $nombre
 * @property string|null $ruc
 * @property string $rubro
 * @property bool $ficticio
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Contrato> $contratos
 */
#[Table('proveedores')]
#[Fillable(['nombre', 'ruc', 'rubro', 'ficticio'])]
class Proveedor extends Model
{
    /**
     * Relaciones que necesita ScoringService para calcular sin consultas extra.
     */
    public const HISTORIA = ['contratos.dependencia', 'contratos.eventos', 'contratos.evaluaciones'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ficticio' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Contrato, $this>
     */
    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }

    /**
     * @return HasManyThrough<Evento, Contrato, $this>
     */
    public function eventos(): HasManyThrough
    {
        return $this->hasManyThrough(Evento::class, Contrato::class);
    }

    /**
     * @return HasManyThrough<Evaluacion, Contrato, $this>
     */
    public function evaluaciones(): HasManyThrough
    {
        return $this->hasManyThrough(Evaluacion::class, Contrato::class);
    }
}
