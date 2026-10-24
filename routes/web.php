<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// TEMPORAL: rutas con datos mock del frontend; reemplazar por controladores reales (Persona A).
if (! app()->isProduction()) {
    require __DIR__.'/frontend-preview.php';
}

require __DIR__.'/settings.php';
