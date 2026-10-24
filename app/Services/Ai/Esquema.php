<?php

namespace App\Services\Ai;

/**
 * Helpers para JSON Schema en modo strict de OpenAI: todas las propiedades
 * van en `required`, `additionalProperties: false` y los nulos se declaran
 * con `["tipo", "null"]`.
 */
final class Esquema
{
    /**
     * @param  array<string, array<string, mixed>>  $propiedades
     * @return array<string, mixed>
     */
    public static function objeto(array $propiedades): array
    {
        return [
            'type' => 'object',
            'properties' => $propiedades,
            'required' => array_keys($propiedades),
            'additionalProperties' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function texto(bool $nullable = false, ?string $descripcion = null): array
    {
        return self::tipo('string', $nullable, $descripcion);
    }

    /**
     * @return array<string, mixed>
     */
    public static function entero(bool $nullable = false, ?string $descripcion = null): array
    {
        return self::tipo('integer', $nullable, $descripcion);
    }

    /**
     * @return array<string, mixed>
     */
    public static function numero(bool $nullable = false, ?string $descripcion = null): array
    {
        return self::tipo('number', $nullable, $descripcion);
    }

    /**
     * @return array<string, mixed>
     */
    public static function booleano(bool $nullable = false, ?string $descripcion = null): array
    {
        return self::tipo('boolean', $nullable, $descripcion);
    }

    /**
     * @param  list<string>  $valores
     * @return array<string, mixed>
     */
    public static function enum(array $valores, bool $nullable = false, ?string $descripcion = null): array
    {
        return [
            ...self::tipo('string', $nullable, $descripcion),
            'enum' => $nullable ? [...$valores, null] : $valores,
        ];
    }

    /**
     * @param  array<string, mixed>  $items
     * @return array<string, mixed>
     */
    public static function lista(array $items, bool $nullable = false, ?string $descripcion = null): array
    {
        return [...self::tipo('array', $nullable, $descripcion), 'items' => $items];
    }

    /**
     * @return array<string, mixed>
     */
    private static function tipo(string $tipo, bool $nullable, ?string $descripcion): array
    {
        $esquema = ['type' => $nullable ? [$tipo, 'null'] : $tipo];

        if ($descripcion !== null) {
            $esquema['description'] = $descripcion;
        }

        return $esquema;
    }
}
