<?php

namespace App\Services\Ai;

use App\Models\Evento;
use Illuminate\Support\Carbon;

/**
 * Lee un dictamen anonimizado y propone los eventos con su cita textual
 * (CLAUDE.md §5.B). No guarda nada: el usuario revisa y confirma en la UI.
 */
class ExtractorService
{
    public const MAX_CARACTERES = 15000;

    /** Tipos en los que "dias" tiene sentido (atraso, prórroga o ampliación de plazo). */
    private const TIPOS_CON_DIAS = ['atraso', 'multa', 'prorroga', 'ampliacion'];

    public function __construct(private OpenAiClient $ia) {}

    /**
     * @return array{proveedor_mencionado: string|null, contrato: array<string, mixed>, dependencia_mencionada: string|null, resumen: string, eventos: list<array<string, mixed>>}
     *
     * @throws AiUnavailableException
     */
    public function analizar(string $texto): array
    {
        $r = $this->ia->json($this->prompt(), mb_substr($texto, 0, self::MAX_CARACTERES), 'extraccion_dictamen', $this->esquema());
        $contrato = is_array($r['contrato'] ?? null) ? $r['contrato'] : [];

        return [
            'proveedor_mencionado' => self::texto($r['proveedor_mencionado'] ?? null),
            'contrato' => [
                'codigo' => self::texto($contrato['codigo'] ?? null),
                'objeto' => self::texto($contrato['objeto'] ?? null) ?? '',
                'monto' => is_numeric($contrato['monto'] ?? null) ? (float) $contrato['monto'] : null,
                'fecha_inicio' => self::fecha($contrato['fecha_inicio'] ?? null),
                'fecha_fin_pactada' => self::fecha($contrato['fecha_fin_pactada'] ?? null),
            ],
            'dependencia_mencionada' => self::texto($r['dependencia_mencionada'] ?? null),
            'resumen' => self::texto($r['resumen'] ?? null) ?? '',
            'eventos' => array_values(array_filter(array_map(
                fn ($e) => is_array($e) ? $this->evento($e) : null,
                is_array($r['eventos'] ?? null) ? $r['eventos'] : [],
            ))),
        ];
    }

    /**
     * Normaliza un evento: tipos y categorías fuera de la lista se descartan.
     *
     * @param  array<mixed>  $e
     * @return array<string, mixed>|null
     */
    private function evento(array $e): ?array
    {
        $descripcion = self::texto($e['descripcion'] ?? null);

        if (! in_array($e['tipo'] ?? null, Evento::TIPOS, true) || $descripcion === null) {
            return null;
        }

        return [
            'tipo' => $e['tipo'],
            'fecha' => self::fecha($e['fecha'] ?? null),
            'dias' => in_array($e['tipo'], self::TIPOS_CON_DIAS, true) && is_numeric($e['dias'] ?? null)
                ? max(0, (int) $e['dias'])
                : null,
            'monto' => is_numeric($e['monto'] ?? null) ? (float) $e['monto'] : null,
            'categoria' => in_array($e['categoria'] ?? null, Evento::CATEGORIAS, true) ? $e['categoria'] : null,
            'descripcion' => $descripcion,
            'extracto_fuente' => self::texto($e['extracto_fuente'] ?? null),
        ];
    }

    private static function texto(mixed $valor): ?string
    {
        return is_string($valor) && trim($valor) !== '' ? trim($valor) : null;
    }

    private static function fecha(mixed $valor): ?string
    {
        return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) && Carbon::canBeCreatedFromFormat($valor, 'Y-m-d')
            ? $valor
            : null;
    }

    private function prompt(): string
    {
        $tipos = implode(', ', Evento::TIPOS);
        $categorias = implode(', ', Evento::CATEGORIAS);

        return <<<PROMPT
        Analizás dictámenes, informes técnicos y notas de contratación de una universidad pública para registrar la historia de un proveedor.
        Los documentos están anonimizados con marcadores como [CONTRATISTA], [MONTO] o [NOMBRE]: copiá los marcadores tal cual, nunca inventes el dato real.

        Extraé los hechos relevantes como eventos:
        - tipo (uno de): {$tipos}.
        - categoria (una de, o null): {$categorias}.
        - fecha en formato YYYY-MM-DD si figura en el documento; si no, null.
        - dias: SOLO días de atraso, de prórroga o de ampliación de plazo. No uses el plazo que se otorga para cumplir una intimación. Si no hay, null.
        - monto: solo si el documento indica un importe concreto; si no, null.
        - descripcion: una oración clara en español, sin datos que no estén en el texto.
        - extracto_fuente: cita TEXTUAL y corta (máximo unas 30 palabras) del fragmento que respalda el evento.

        Reglas: no inventes datos; si un valor no aparece, null.
        Cada hecho distinto es un evento separado y no dupliques un mismo hecho. Guía de tipos:
        - defectos, incumplimientos de especificación o fallas constatadas → observacion_tecnica;
        - intimaciones, emplazamientos, quejas o pedidos formales al contratista → reclamo (aunque no tengan fecha);
        - multas o sanciones económicas → multa; entregas fuera de plazo → atraso; rescisión → terminacion;
        - extensión de plazo → prorroga; aumento de monto o plazo por convenio → ampliacion;
        - recepción provisoria o definitiva sin objeciones → recepcion_conforme.
        "resumen": una o dos oraciones sobre qué dice el documento.
        En "contrato" completá código, objeto, monto y fechas solo si aparecen.
        PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function esquema(): array
    {
        return Esquema::objeto([
            'proveedor_mencionado' => Esquema::texto(nullable: true),
            'contrato' => Esquema::objeto([
                'codigo' => Esquema::texto(nullable: true),
                'objeto' => Esquema::texto(nullable: true),
                'monto' => Esquema::numero(nullable: true),
                'fecha_inicio' => Esquema::texto(nullable: true, descripcion: 'YYYY-MM-DD'),
                'fecha_fin_pactada' => Esquema::texto(nullable: true, descripcion: 'YYYY-MM-DD'),
            ]),
            'dependencia_mencionada' => Esquema::texto(nullable: true),
            'resumen' => Esquema::texto(),
            'eventos' => Esquema::lista(Esquema::objeto([
                'tipo' => Esquema::enum(Evento::TIPOS),
                'fecha' => Esquema::texto(nullable: true, descripcion: 'YYYY-MM-DD'),
                'dias' => Esquema::entero(nullable: true),
                'monto' => Esquema::numero(nullable: true),
                'categoria' => Esquema::enum(Evento::CATEGORIAS, nullable: true),
                'descripcion' => Esquema::texto(),
                'extracto_fuente' => Esquema::texto(nullable: true),
            ])),
        ]);
    }
}
