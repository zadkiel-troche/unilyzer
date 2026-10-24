export const anclaEvento = (id: number) => `evento-${id}`;

/** Lleva la vista a un evento de la línea de tiempo y lo resalta brevemente. */
export function irAEvento(id: number): void {
    const elemento = document.getElementById(anclaEvento(id));

    if (!elemento) {
        return;
    }

    const reducirMovimiento = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;
    elemento.scrollIntoView({
        behavior: reducirMovimiento ? 'auto' : 'smooth',
        block: 'center',
    });
    elemento.classList.remove('evento-resaltado');
    void elemento.offsetWidth; // reinicia la animación si se vuelve a citar
    elemento.classList.add('evento-resaltado');
    elemento.focus({ preventScroll: true });
}
