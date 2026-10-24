<?php

namespace App\Services\Documentos;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser as PdfParser;
use Throwable;
use ZipArchive;

/**
 * Convierte un documento (PDF, Word, OpenDocument, HTML, RTF o texto plano)
 * en texto para que el ExtractorService lo analice.
 */
class ExtractorTextoDocumento
{
    /** Extensiones que se leen tal cual, como texto plano. */
    public const TEXTO_PLANO = ['txt', 'text', 'md', 'markdown', 'csv', 'tsv', 'log', 'json', 'xml'];

    public const EXTENSIONES = [...self::TEXTO_PLANO, 'html', 'htm', 'rtf', 'docx', 'odt', 'pdf'];

    public function extraer(UploadedFile $archivo): string
    {
        $extension = strtolower($archivo->getClientOriginalExtension());
        $ruta = $archivo->getRealPath();

        $texto = match (true) {
            in_array($extension, self::TEXTO_PLANO, true) => $this->aUtf8((string) file_get_contents($ruta)),
            in_array($extension, ['html', 'htm'], true) => $this->desdeHtml($this->aUtf8((string) file_get_contents($ruta))),
            $extension === 'rtf' => $this->desdeRtf((string) file_get_contents($ruta)),
            $extension === 'docx' => $this->desdeXmlEnZip($ruta, 'word/document.xml', '#</w:p>|<w:(?:br|cr)\b[^>]*/>#', '#<w:tab/>#'),
            $extension === 'odt' => $this->desdeXmlEnZip($ruta, 'content.xml', '#</text:(?:p|h)>|<text:line-break/>#', '#<text:tab/>#'),
            $extension === 'pdf' => $this->desdePdf($ruta),
            default => throw new DocumentoNoLegibleException("El formato .{$extension} no está soportado."),
        };

        $texto = $this->normalizar($texto);

        if ($texto === '') {
            throw new DocumentoNoLegibleException(
                $extension === 'pdf'
                    ? 'El PDF no tiene texto seleccionable (parece escaneado). Copiá el texto a mano o usá un PDF con texto.'
                    : 'El archivo no contiene texto.',
            );
        }

        return $texto;
    }

    private function desdePdf(string $ruta): string
    {
        try {
            return (new PdfParser)->parseFile($ruta)->getText();
        } catch (Throwable) {
            throw new DocumentoNoLegibleException('No se pudo leer el PDF. Puede estar dañado o protegido con contraseña.');
        }
    }

    /**
     * Word (.docx) y OpenDocument (.odt) son ZIP con el contenido en XML:
     * se convierten los cortes de párrafo y tabulaciones (regex) antes de quitar etiquetas.
     */
    private function desdeXmlEnZip(string $ruta, string $entrada, string $saltos, string $tabulaciones): string
    {
        $zip = new ZipArchive;

        if ($zip->open($ruta) !== true || ($xml = $zip->getFromName($entrada)) === false) {
            throw new DocumentoNoLegibleException('No se pudo abrir el documento. Verificá que no esté dañado.');
        }

        $zip->close();

        $xml = preg_replace($saltos, "\n", $xml) ?? $xml;
        $xml = preg_replace($tabulaciones, "\t", $xml) ?? $xml;

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function desdeHtml(string $html): string
    {
        $html = preg_replace('#<(script|style|head)\b[^>]*>.*?</\1>#is', '', $html) ?? $html;
        $html = preg_replace('#<br\s*/?>|</(p|div|li|tr|h[1-6])>#i', "\n", $html) ?? $html;

        return html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /** Lectura básica de RTF: alcanza para dictámenes guardados desde un procesador de texto. */
    private function desdeRtf(string $rtf): string
    {
        // Grupos que no son contenido (tablas de fuentes, colores, metadatos).
        $rtf = preg_replace('/\{\\\\(?:\*|fonttbl|colortbl|stylesheet|info|pict)[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/s', '', $rtf) ?? $rtf;
        $rtf = preg_replace('/\\\\(?:par|line)\b ?/', "\n", $rtf) ?? $rtf;
        $rtf = preg_replace('/\\\\tab\b ?/', "\t", $rtf) ?? $rtf;
        $rtf = preg_replace_callback("/\\\\'([0-9a-f]{2})/i", fn ($m) => mb_convert_encoding(chr(hexdec($m[1])), 'UTF-8', 'Windows-1252'), $rtf) ?? $rtf;
        $rtf = preg_replace_callback('/\\\\u(-?\d+)\??/', fn ($m) => mb_chr(((int) $m[1] + 65536) % 65536, 'UTF-8'), $rtf) ?? $rtf;
        $rtf = preg_replace('/\\\\[a-z]+-?\d* ?/i', '', $rtf) ?? $rtf;

        return str_replace(['{', '}', '\\'], '', $rtf);
    }

    /** Los .txt de Windows suelen venir en Windows-1252: se pasan a UTF-8. */
    private function aUtf8(string $texto): string
    {
        $texto = preg_replace('/^\xEF\xBB\xBF/', '', $texto) ?? $texto;

        return mb_check_encoding($texto, 'UTF-8') ? $texto : mb_convert_encoding($texto, 'UTF-8', 'Windows-1252');
    }

    private function normalizar(string $texto): string
    {
        $texto = str_replace(["\r\n", "\r", "\u{00A0}"], ["\n", "\n", ' '], $texto);
        $texto = preg_replace('/[ \t]+\n/', "\n", $texto) ?? $texto;
        $texto = preg_replace('/\n{3,}/', "\n\n", $texto) ?? $texto;

        return trim($texto);
    }
}
