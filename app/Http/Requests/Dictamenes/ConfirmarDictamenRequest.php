<?php

namespace App\Http\Requests\Dictamenes;

use App\Models\Contrato;
use App\Models\Evento;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Contrato: ConfirmarDictamenPayload en resources/js/types/proveedores.ts.
 */
class ConfirmarDictamenRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'proveedor_id' => ['nullable', 'required_without:proveedor_nuevo', 'integer', 'exists:proveedores,id'],
            'proveedor_nuevo' => ['nullable', 'required_without:proveedor_id', 'array'],
            'proveedor_nuevo.nombre' => ['required_with:proveedor_nuevo', 'string', 'max:255'],
            'proveedor_nuevo.rubro' => ['required_with:proveedor_nuevo', 'string', 'max:100'],

            'contrato_id' => ['nullable', 'required_without:contrato_nuevo', 'integer', 'exists:contratos,id'],
            'contrato_nuevo' => ['nullable', 'required_without:contrato_id', 'array'],
            'contrato_nuevo.codigo' => ['nullable', 'string', 'max:100'],
            'contrato_nuevo.objeto' => ['required_with:contrato_nuevo', 'string', 'max:1000'],
            'contrato_nuevo.monto' => ['nullable', 'numeric', 'min:0'],
            'contrato_nuevo.fecha_inicio' => ['nullable', 'date'],
            'contrato_nuevo.fecha_fin_pactada' => ['nullable', 'date', 'after_or_equal:contrato_nuevo.fecha_inicio'],
            'contrato_nuevo.estado' => ['nullable', Rule::in(Contrato::ESTADOS)],
            'contrato_nuevo.fecha_fin_real' => ['nullable', 'date', 'after_or_equal:contrato_nuevo.fecha_inicio'],

            'evaluacion' => ['nullable', 'array'],
            'evaluacion.calidad' => ['required_with:evaluacion', 'integer', 'between:1,5'],
            'evaluacion.satisfaccion' => ['required_with:evaluacion', 'integer', 'between:1,5'],
            'evaluacion.comentario' => ['nullable', 'string', 'max:1000'],

            'dependencia_id' => ['nullable', 'integer', 'exists:dependencias,id'],
            'documento_origen' => ['nullable', 'string', 'max:255'],

            'eventos' => ['required', 'array', 'min:1', 'max:50'],
            'eventos.*.tipo' => ['required', Rule::in(Evento::TIPOS)],
            'eventos.*.fecha' => ['nullable', 'date'],
            'eventos.*.dias' => ['nullable', 'integer', 'min:0'],
            'eventos.*.monto' => ['nullable', 'numeric', 'min:0'],
            'eventos.*.categoria' => ['nullable', Rule::in(Evento::CATEGORIAS)],
            'eventos.*.descripcion' => ['required', 'string', 'max:2000'],
            'eventos.*.extracto_fuente' => ['nullable', 'string', 'max:2000'],
            'eventos.*.extraido_por_ia' => ['required', 'boolean'],
        ];
    }

    /**
     * El contrato elegido tiene que ser del proveedor elegido.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $contratoId = $this->input('contrato_id');

                if ($contratoId === null || $validator->errors()->isNotEmpty()) {
                    return;
                }

                $proveedorId = $this->input('proveedor_id');
                $esDelProveedor = $proveedorId !== null
                    && Contrato::whereKey($contratoId)->where('proveedor_id', $proveedorId)->exists();

                if (! $esDelProveedor) {
                    $validator->errors()->add('contrato_id', 'El contrato no pertenece al proveedor elegido.');
                }
            },
        ];
    }
}
