<?php

use App\Http\Controllers\Dictamenes\ExtraerTextoController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('dictamenes/extraer-texto', ExtraerTextoController::class)->name('dictamenes.extraer-texto');
});

// TEMPORAL: rutas con datos mock del frontend; reemplazar por controladores reales (Persona A).
if (! app()->isProduction()) {
    require __DIR__.'/frontend-preview.php';
}

require __DIR__.'/settings.php';
