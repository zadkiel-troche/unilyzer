<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * La IA no está disponible (sin clave, error HTTP, timeout o respuesta
 * inválida). Los llamadores hacen fallback y la UI lo avisa.
 */
class AiUnavailableException extends RuntimeException {}
