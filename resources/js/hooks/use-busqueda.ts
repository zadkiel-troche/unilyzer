import { postJson } from '@/lib/api';
import { useAsyncAction } from '@/hooks/use-async-action';
import { busqueda } from '@/routes';
import type { BusquedaRespuesta } from '@/types';

const buscar = (q: string) =>
    postJson<BusquedaRespuesta>(busqueda.url(), { q });

export function useBusqueda() {
    return useAsyncAction(buscar);
}
