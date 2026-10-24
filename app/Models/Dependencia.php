<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $nombre
 * @property string|null $sigla
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Table('dependencias')]
#[Fillable(['nombre', 'sigla'])]
class Dependencia extends Model
{
    /**
     * @return HasMany<Contrato, $this>
     */
    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }
}
