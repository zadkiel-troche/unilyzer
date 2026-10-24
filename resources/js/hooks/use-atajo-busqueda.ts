import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { index as proveedores } from '@/routes/proveedores';

/** id del buscador en lenguaje natural (Panel y Proveedores). */
export const ID_BUSCADOR = 'busqueda';

/** Enfoca el buscador de la página o, si no hay, abre Proveedores. */
export function abrirBusqueda(): void {
    const buscador = document.getElementById(ID_BUSCADOR);

    if (buscador) {
        buscador.focus();
        buscador.scrollIntoView({ block: 'center', behavior: 'smooth' });

        return;
    }

    router.visit(proveedores());
}

/** Atajo global ⌘K / Ctrl+K. Se registra una sola vez en el encabezado. */
export function useAtajoBusqueda(): void {
    useEffect(() => {
        const alPresionar = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                abrirBusqueda();
            }
        };

        window.addEventListener('keydown', alPresionar);

        return () => window.removeEventListener('keydown', alPresionar);
    }, []);
}
