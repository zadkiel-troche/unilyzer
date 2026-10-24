<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $contrato_id
 * @property int|null $dependencia_id
 * @property int $calidad
 * @property int $satisfaccion
 * @property string|null $comentario
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Contrato $contrato
 */
#[Table('evaluaciones')]
#[Fillable(['contrato_id', 'dependencia_id', 'calidad', 'satisfaccion', 'comentario'])]
class Evaluacion extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'calidad' => 'integer',
            'satisfaccion' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Contrato, $this>
     */
    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class);
    }
}
