import { GitBranch, Scale, Search } from 'lucide-react';

export const PILARES = [
    {
        icono: Search,
        titulo: 'Buscar',
        texto: 'Preguntá en lenguaje natural y encontrá antecedentes sin revisar expedientes a mano.',
    },
    {
        icono: GitBranch,
        titulo: 'Trazar',
        texto: 'Cada dato muestra su fuente: el documento, la dependencia y el extracto que lo respalda.',
    },
    {
        icono: Scale,
        titulo: 'Decidir',
        texto: 'Un puntaje explicable que aporta evidencia; la decisión sigue siendo de las personas.',
    },
] as const;
