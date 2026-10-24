<?php

namespace Database\Seeders;

use App\Models\Dependencia;
use Illuminate\Database\Seeder;

class DependenciaSeeder extends Seeder
{
    /** Dependencias ficticias de la universidad (sigla => nombre). */
    public const DEPENDENCIAS = [
        'FI' => 'Facultad de Ingeniería',
        'FCM' => 'Facultad de Ciencias Médicas',
        'DI' => 'Dirección de Infraestructura',
        'DTIC' => 'Dirección de TIC',
        'REC' => 'Rectorado',
        'FCE' => 'Facultad de Ciencias Económicas',
    ];

    public function run(): void
    {
        foreach (self::DEPENDENCIAS as $sigla => $nombre) {
            Dependencia::updateOrCreate(['sigla' => $sigla], ['nombre' => $nombre]);
        }
    }
}
