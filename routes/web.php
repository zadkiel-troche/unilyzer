<?php

use App\Http\Controllers\AsistenteController;
use App\Http\Controllers\BusquedaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DictamenController;
use App\Http\Controllers\Dictamenes\ExtraerTextoController;
use App\Http\Controllers\ProveedorController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('proveedores', [ProveedorController::class, 'index'])->name('proveedores.index');
    Route::get('proveedores/{proveedor}', [ProveedorController::class, 'show'])->name('proveedores.show');
    Route::post('proveedores/{proveedor}/resumen', [ProveedorController::class, 'resumen'])->name('proveedores.resumen');

    Route::post('busqueda', BusquedaController::class)->name('busqueda');

    Route::get('dictamenes/cargar', [DictamenController::class, 'create'])->name('dictamenes.create');
    Route::post('dictamenes/extraer-texto', ExtraerTextoController::class)->name('dictamenes.extraer-texto');
    Route::post('dictamenes/analizar', [DictamenController::class, 'analizar'])->name('dictamenes.analizar');
    Route::post('dictamenes/confirmar', [DictamenController::class, 'confirmar'])->name('dictamenes.confirmar');

    Route::get('asistente', [AsistenteController::class, 'index'])->name('asistente.index');
    Route::post('asistente', [AsistenteController::class, 'responder'])->name('asistente.responder');
});

require __DIR__.'/settings.php';
