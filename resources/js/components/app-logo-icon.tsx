import type { SVGAttributes } from 'react';

/**
 * Símbolo de Unilyzer: un marco de escaneo con una lupa al centro
 * (buscar y analizar antecedentes). Usa `currentColor`.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <path d="M3.5 8V5.5a2 2 0 0 1 2-2H8" />
            <path d="M16 3.5h2.5a2 2 0 0 1 2 2V8" />
            <path d="M20.5 16v2.5a2 2 0 0 1-2 2H16" />
            <path d="M8 20.5H5.5a2 2 0 0 1-2-2V16" />
            <circle cx="11.25" cy="11.25" r="3" />
            <path d="m13.5 13.5 2 2" />
        </svg>
    );
}
