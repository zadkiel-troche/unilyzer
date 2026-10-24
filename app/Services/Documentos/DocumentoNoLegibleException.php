<?php

namespace App\Services\Documentos;

use RuntimeException;

/**
 * El archivo no se pudo convertir a texto. El mensaje se muestra al usuario.
 */
class DocumentoNoLegibleException extends RuntimeException {}
