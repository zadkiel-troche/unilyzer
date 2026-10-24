import { AudioLines, Building2, FileUp, LayoutDashboard } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as asistente } from '@/routes/asistente';
import { create as cargarDictamen } from '@/routes/dictamenes';
import { index as proveedores } from '@/routes/proveedores';
import type { NavItem } from '@/types';

/** Secciones principales; las usan el sidebar y el layout con menú superior. */
export const NAVEGACION_PRINCIPAL: NavItem[] = [
    { title: 'Panel', href: dashboard(), icon: LayoutDashboard },
    { title: 'Proveedores', href: proveedores(), icon: Building2 },
    { title: 'Hablar con la IA', href: asistente(), icon: AudioLines },
    { title: 'Cargar dictamen', href: cargarDictamen(), icon: FileUp },
];
