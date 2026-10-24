import { irAEvento } from '@/lib/evento-ancla';

/** Link a un evento citado (por la IA o por una reincidencia). */
export function EventoCita({ id }: { id: number }) {
    return (
        <button
            type="button"
            onClick={() => irAEvento(id)}
            className="rounded px-1 font-mono text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Ir al evento ${id}`}
        >
            #{id}
        </button>
    );
}
