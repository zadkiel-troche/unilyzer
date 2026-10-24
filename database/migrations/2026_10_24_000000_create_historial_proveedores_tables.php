<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historia clínica del proveedor (CLAUDE.md §3).
     */
    public function up(): void
    {
        Schema::create('dependencias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('sigla')->nullable();
            $table->timestamps();
        });

        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('ruc')->nullable();
            $table->string('rubro')->index();
            $table->boolean('ficticio')->default(true);
            $table->timestamps();
        });

        Schema::create('contratos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proveedor_id')->constrained('proveedores')->cascadeOnDelete();
            $table->foreignId('dependencia_id')->nullable()->constrained('dependencias')->nullOnDelete();
            $table->string('codigo')->nullable();
            $table->text('objeto');
            $table->decimal('monto', 16, 2)->nullable();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin_pactada')->nullable();
            $table->date('fecha_fin_real')->nullable();
            $table->string('estado')->default('en_ejecucion');
            $table->timestamps();
        });

        Schema::create('eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrato_id')->constrained('contratos')->cascadeOnDelete();
            $table->string('tipo')->index();
            $table->date('fecha')->nullable();
            $table->integer('dias')->nullable();
            $table->decimal('monto', 16, 2)->nullable();
            $table->string('categoria')->nullable();
            $table->text('descripcion');
            $table->text('extracto_fuente')->nullable();
            $table->string('documento_origen')->nullable();
            $table->boolean('extraido_por_ia')->default(false);
            $table->timestamps();
        });

        Schema::create('evaluaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrato_id')->constrained('contratos')->cascadeOnDelete();
            $table->foreignId('dependencia_id')->nullable()->constrained('dependencias')->nullOnDelete();
            $table->unsignedTinyInteger('calidad');
            $table->unsignedTinyInteger('satisfaccion');
            $table->text('comentario')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluaciones');
        Schema::dropIfExists('eventos');
        Schema::dropIfExists('contratos');
        Schema::dropIfExists('proveedores');
        Schema::dropIfExists('dependencias');
    }
};
