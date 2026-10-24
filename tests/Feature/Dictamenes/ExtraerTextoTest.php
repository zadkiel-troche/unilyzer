<?php

namespace Tests\Feature\Dictamenes;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use ZipArchive;

class ExtraerTextoTest extends TestCase
{
    use RefreshDatabase;

    private const DICTAMEN = 'Se aplica multa por 12 días de atraso a [CONTRATISTA].';

    public function test_guests_cannot_extract_text()
    {
        $this->postJson(route('dictamenes.extraer-texto'))->assertUnauthorized();
    }

    public function test_plain_text_in_windows_1252_is_converted_to_utf8()
    {
        $archivo = UploadedFile::fake()->createWithContent('dictamen DJ-118.txt', mb_convert_encoding(self::DICTAMEN, 'Windows-1252', 'UTF-8'));

        $this->extraer($archivo)
            ->assertOk()
            ->assertJson([
                'texto' => self::DICTAMEN,
                'documento' => 'dictamen DJ-118',
                'formato' => 'txt',
                'caracteres' => mb_strlen(self::DICTAMEN),
            ]);
    }

    public function test_docx_paragraphs_are_extracted()
    {
        $xml = '<w:document><w:body><w:p><w:r><w:t>DICTAMEN</w:t></w:r></w:p>'
            .'<w:p><w:r><w:t xml:space="preserve">Se aplica multa por 12 días de atraso </w:t></w:r><w:r><w:t>a [CONTRATISTA].</w:t></w:r></w:p></w:body></w:document>';

        $this->extraer($this->zip('dictamen.docx', 'word/document.xml', $xml))
            ->assertOk()
            ->assertJsonPath('texto', "DICTAMEN\n".self::DICTAMEN);
    }

    public function test_odt_paragraphs_are_extracted()
    {
        $xml = '<office:document-content><office:body><office:text><text:h>DICTAMEN</text:h>'
            .'<text:p>'.self::DICTAMEN.'</text:p></office:text></office:body></office:document-content>';

        $this->extraer($this->zip('dictamen.odt', 'content.xml', $xml))
            ->assertOk()
            ->assertJsonPath('texto', "DICTAMEN\n".self::DICTAMEN);
    }

    public function test_html_drops_markup_and_scripts()
    {
        $html = '<html><head><title>x</title><script>alert(1)</script></head><body><h1>DICTAMEN</h1><p>Se aplica multa por 12 d&iacute;as de atraso a [CONTRATISTA].</p></body></html>';

        $this->extraer(UploadedFile::fake()->createWithContent('dictamen.html', $html))
            ->assertOk()
            ->assertJsonPath('texto', "DICTAMEN\n".self::DICTAMEN);
    }

    public function test_rtf_control_words_are_removed()
    {
        $rtf = "{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}\\f0 DICTAMEN\\par Se aplica multa por 12 d\\'edas de atraso a [CONTRATISTA].\\par}";

        $this->extraer(UploadedFile::fake()->createWithContent('dictamen.rtf', $rtf))
            ->assertOk()
            ->assertJsonPath('texto', "DICTAMEN\n".self::DICTAMEN);
    }

    public function test_pdf_text_is_extracted()
    {
        $this->extraer(UploadedFile::fake()->createWithContent('dictamen.pdf', $this->pdf('Se aplica multa por atraso')))
            ->assertOk()
            ->assertJsonPath('formato', 'pdf')
            ->assertJsonPath('texto', fn (string $texto) => str_contains($texto, 'Se aplica multa por atraso'));
    }

    public function test_corrupt_pdf_returns_a_readable_error()
    {
        $this->extraer(UploadedFile::fake()->createWithContent('dictamen.pdf', 'esto no es un pdf'))
            ->assertUnprocessable()
            ->assertJsonPath('message', fn (string $m) => str_contains($m, 'PDF'));
    }

    public function test_unsupported_formats_are_rejected()
    {
        $this->extraer(UploadedFile::fake()->createWithContent('planilla.xlsx', 'x'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('archivo');
    }

    public function test_empty_files_are_rejected()
    {
        $this->extraer(UploadedFile::fake()->createWithContent('vacio.txt', "  \n "))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El archivo no contiene texto.');
    }

    private function extraer(UploadedFile $archivo)
    {
        return $this->actingAs(User::factory()->create())
            ->postJson(route('dictamenes.extraer-texto'), ['archivo' => $archivo]);
    }

    private function zip(string $nombre, string $entrada, string $contenido): UploadedFile
    {
        $ruta = tempnam(sys_get_temp_dir(), 'doc');
        $zip = new ZipArchive;
        $zip->open($ruta, ZipArchive::OVERWRITE);
        $zip->addFromString($entrada, $contenido);
        $zip->close();

        return new UploadedFile($ruta, $nombre, null, null, true);
    }

    /** PDF mínimo de una página con una línea de texto en Helvetica. */
    private function pdf(string $texto): string
    {
        $stream = "BT /F1 12 Tf 72 720 Td ({$texto}) Tj ET";
        $objetos = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objetos as $i => $objeto) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$objeto}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= 'xref
0 '.(count($objetos) + 1)."\n0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer << /Size '.(count($objetos) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
