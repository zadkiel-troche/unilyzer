import type { MouseEvent } from 'react';

/** Mueve el brillo de `.spotlight` a la posición del cursor (sin re-renderizar). */
export function seguirCursor(e: MouseEvent<HTMLElement>): void {
    const caja = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - caja.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - caja.top}px`);
}
