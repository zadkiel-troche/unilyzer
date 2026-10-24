import type { SVGAttributes } from 'react';

/**
 * Símbolo de Unilyzer: una lente de búsqueda que contiene registros
 * conectados (trazabilidad). El nodo final, en turquesa, es el hallazgo.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <circle
                cx="14"
                cy="14"
                r="9.75"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
            />
            <path
                d="M21.5 21.5 28 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M9.25 17.25 13 12.25l5 2.75"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
            />
            <circle cx="9.25" cy="17.25" r="1.75" fill="currentColor" />
            <circle cx="13" cy="12.25" r="1.75" fill="currentColor" />
            <circle cx="18" cy="15" r="2.25" fill="#66E3D0" />
        </svg>
    );
}
