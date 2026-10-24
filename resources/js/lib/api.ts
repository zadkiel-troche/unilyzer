export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

function xsrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

function mensajeDeError(status: number, body: unknown): string {
    if (body && typeof body === 'object' && 'message' in body) {
        return String(body.message);
    }

    if (status === 419) {
        return 'La sesión expiró. Recargá la página e intentá de nuevo.';
    }

    return 'No se pudo completar la solicitud. Intentá de nuevo.';
}

async function enviar<T>(
    url: string,
    body: BodyInit,
    headers: Record<string, string> = {},
): Promise<T> {
    let response: Response;

    try {
        response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': xsrfToken(),
                ...headers,
            },
            body,
        });
    } catch {
        throw new ApiError('Sin conexión con el servidor.', 0);
    }

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            mensajeDeError(response.status, data),
            response.status,
        );
    }

    return data as T;
}

/** POST JSON con CSRF de Laravel (cookie XSRF-TOKEN). */
export function postJson<T>(url: string, body: unknown = {}): Promise<T> {
    return enviar<T>(url, JSON.stringify(body), {
        'Content-Type': 'application/json',
    });
}

/** POST multipart (archivos). El navegador arma el Content-Type con el boundary. */
export function postForm<T>(url: string, body: FormData): Promise<T> {
    return enviar<T>(url, body);
}
