<?php

namespace App\Http\Requests\Dictamenes;

use App\Services\Documentos\ExtractorTextoDocumento;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ExtraerTextoRequest extends FormRequest
{
    /** Tamaño máximo del archivo en kilobytes (10 MB). */
    public const MAX_KB = 10240;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'archivo' => [
                'required',
                'file',
                'max:'.self::MAX_KB,
                'extensions:'.implode(',', ExtractorTextoDocumento::EXTENSIONES),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'archivo.required' => 'Elegí un archivo.',
            'archivo.file' => 'No se pudo subir el archivo.',
            'archivo.uploaded' => 'No se pudo subir el archivo.',
            'archivo.max' => 'El archivo supera los 10 MB.',
            'archivo.extensions' => 'Formato no soportado. Usá PDF, Word (.docx), OpenDocument (.odt), RTF, HTML o texto (.txt, .md, .csv).',
        ];
    }
}
