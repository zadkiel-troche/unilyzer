import { useCallback, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';

type Estado<T> =
    | { status: 'idle'; data: null; error: null }
    | { status: 'loading'; data: T | null; error: null }
    | { status: 'success'; data: T; error: null }
    | { status: 'error'; data: null; error: string };

/**
 * Ejecuta una acción asíncrona y expone su estado. Si se lanza otra antes de
 * que termine la anterior, la respuesta vieja se descarta.
 */
export function useAsyncAction<A extends unknown[], T>(
    accion: (...args: A) => Promise<T>,
) {
    const [estado, setEstado] = useState<Estado<T>>({
        status: 'idle',
        data: null,
        error: null,
    });
    const ultima = useRef(0);

    const ejecutar = useCallback(
        async (...args: A): Promise<T | null> => {
            const id = ++ultima.current;
            setEstado((previo) => ({
                status: 'loading',
                data: previo.data,
                error: null,
            }));

            try {
                const data = await accion(...args);

                if (id === ultima.current) {
                    setEstado({ status: 'success', data, error: null });
                }

                return data;
            } catch (e) {
                if (id === ultima.current) {
                    const error =
                        e instanceof ApiError
                            ? e.message
                            : 'Ocurrió un error inesperado.';
                    setEstado({ status: 'error', data: null, error });
                }

                return null;
            }
        },
        [accion],
    );

    const reiniciar = useCallback(() => {
        ultima.current++;
        setEstado({ status: 'idle', data: null, error: null });
    }, []);

    return {
        ...estado,
        cargando: estado.status === 'loading',
        ejecutar,
        reiniciar,
    };
}
