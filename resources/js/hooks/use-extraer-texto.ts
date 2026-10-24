import { useAsyncAction } from '@/hooks/use-async-action';
import { postForm } from '@/lib/api';
import { extraerTexto } from '@/routes/dictamenes';
import type { TextoExtraido } from '@/types';

const subir = (archivo: File) => {
    const datos = new FormData();
    datos.append('archivo', archivo);

    return postForm<TextoExtraido>(extraerTexto.url(), datos);
};

export function useExtraerTexto() {
    return useAsyncAction(subir);
}
