import { postJson } from '@/lib/api';
import { useAsyncAction } from '@/hooks/use-async-action';
import { resumen } from '@/routes/proveedores';
import type { ResumenIa } from '@/types';

const generar = (proveedorId: number) =>
    postJson<ResumenIa>(resumen.url(proveedorId));

export function useResumenIa() {
    return useAsyncAction(generar);
}
