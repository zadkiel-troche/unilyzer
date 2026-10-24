/** Mismos formatos que ExtractorTextoDocumento::EXTENSIONES en el backend. */
export const FORMATOS = [
    { etiqueta: 'PDF', extensiones: ['pdf'] },
    { etiqueta: 'Word', extensiones: ['docx'] },
    { etiqueta: 'OpenDocument', extensiones: ['odt'] },
    { etiqueta: 'RTF', extensiones: ['rtf'] },
    { etiqueta: 'HTML', extensiones: ['html', 'htm'] },
    {
        etiqueta: 'Texto',
        extensiones: [
            'txt',
            'text',
            'md',
            'markdown',
            'csv',
            'tsv',
            'log',
            'json',
            'xml',
        ],
    },
] as const;

const EXTENSIONES: readonly string[] = FORMATOS.flatMap((f) => f.extensiones);

/** Valor para el atributo `accept` del input de archivos. */
export const ACCEPT = EXTENSIONES.map((e) => `.${e}`).join(',');

export const MAX_MB = 10;

export function extension(nombre: string): string {
    return nombre.includes('.') ? nombre.split('.').pop()!.toLowerCase() : '';
}

/** Validación rápida antes de subir; el backend vuelve a validar. */
export function problemaConArchivo(archivo: File): string | null {
    if (!EXTENSIONES.includes(extension(archivo.name))) {
        return archivo.name.toLowerCase().endsWith('.doc')
            ? 'Los .doc antiguos no se pueden leer. Guardalo como .docx o PDF desde Word.'
            : 'Formato no soportado. Usá PDF, Word, OpenDocument, RTF, HTML o texto.';
    }

    if (archivo.size > MAX_MB * 1024 * 1024) {
        return `El archivo supera los ${MAX_MB} MB.`;
    }

    return null;
}
