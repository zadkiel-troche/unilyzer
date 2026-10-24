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
 * @property string $tipo
 * @property Carbon|null $fecha
 * @property int|null $dias
 * @property string|null $monto
 * @property string|null $categoria
 * @property string $descripcion
 * @property string|null $extracto_fuente
 * @property string|null $documento_origen
 * @property bool $extraido_por_ia
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Contrato $contrato
 */
#[Table('eventos')]
#[Fillable(['contrato_id', 'tipo', 'fecha', 'dias', 'monto', 'categoria', 'descripcion', 'extracto_fuente', 'documento_origen', 'extraido_por_ia'])]
class Evento extends Model
{
    /** Tipos de evento (CLAUDE.md §3). Única fuente para validación y prompts. */
    public const TIPOS = [
        'atraso', 'multa', 'prorroga', 'reclamo', 'observacion_tecnica',
        'ampliacion', 'terminacion', 'cambio_administrativo', 'recepcion_conforme',
    ];

    /** Tipos que cuentan como incidencia en el puntaje. */
    public const NEGATIVOS = ['atraso', 'multa', 'reclamo', 'observacion_tecnica', 'terminacion'];

    /** Categorías para detectar reincidencias. */
    public const CATEGORIAS = ['plazo', 'calidad', 'materiales', 'documentacion', 'seguridad', 'atencion', 'clima'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'dias' => 'integer',
            'monto' => 'decimal:2',
            'extraido_por_ia' => 'boolean',
        ];
    }

    public function esNegativo(): bool
    {
        return in_array($this->tipo, self::NEGATIVOS, true);
    }

    /**
     * @return BelongsTo<Contrato, $this>
     */
    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class);
    }
}
