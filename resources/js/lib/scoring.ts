import type { ClaveComponente } from '@/types';

export const COMPONENTES: {
    clave: ClaveComponente;
    etiqueta: string;
    peso: number;
}[] = [
    { clave: 'plazos', etiqueta: 'Plazos', peso: 35 },
    { clave: 'calidad', etiqueta: 'Calidad', peso: 35 },
    { clave: 'incidencias', etiqueta: 'Incidencias', peso: 20 },
    { clave: 'reincidencia', etiqueta: 'Reincidencia', peso: 10 },
];
