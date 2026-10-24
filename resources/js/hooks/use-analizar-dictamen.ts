import { postJson } from '@/lib/api';
import { useAsyncAction } from '@/hooks/use-async-action';
import { analizar } from '@/routes/dictamenes';
import type { ExtraccionDictamen } from '@/types';

const analizarTexto = (texto: string) =>
    postJson<ExtraccionDictamen>(analizar.url(), { texto });

export function useAnalizarDictamen() {
    return useAsyncAction(analizarTexto);
}
