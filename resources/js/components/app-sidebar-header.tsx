import { Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { abrirBusqueda, useAtajoBusqueda } from '@/hooks/use-atajo-busqueda';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    useAtajoBusqueda();

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl transition-[width,height] ease-linear supports-[backdrop-filter]:bg-background/55 md:rounded-t-xl md:px-5">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <span className="h-4 w-px bg-border" aria-hidden />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <button
                type="button"
                onClick={abrirBusqueda}
                className="ml-auto flex h-8 items-center gap-2 rounded-lg border bg-muted/40 pr-1.5 pl-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground sm:w-64"
            >
                <Search className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Buscar proveedores…</span>
                <span className="sr-only sm:hidden">Buscar proveedores</span>
                <kbd className="ml-auto hidden rounded border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium sm:inline">
                    ⌘K
                </kbd>
            </button>
        </header>
    );
}
