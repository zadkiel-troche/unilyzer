import { MessagesSquare } from 'lucide-react';
import { OrigenBadge } from '@/components/origen-badge';
import { DependenciasCitadas } from '@/components/asistente/dependencias-citadas';
import { ProveedoresCitados } from '@/components/asistente/proveedores-citados';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { Mensaje } from '@/hooks/use-asistente';
import { cn } from '@/lib/utils';

/** Historial completo de la conversación en un panel lateral. */
export function Transcripcion({ mensajes }: { mensajes: Mensaje[] }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-brand-teal/50 focus-visible:outline-none"
                >
                    <MessagesSquare className="size-3.5" aria-hidden />
                    Transcripción
                    {mensajes.length > 0 && (
                        <span className="rounded-full bg-brand-teal px-1.5 text-[10px] font-semibold text-neutral-950">
                            {mensajes.length}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="w-full gap-0 sm:max-w-md"
            >
                <SheetHeader className="border-b">
                    <SheetTitle>Transcripción</SheetTitle>
                    <SheetDescription>
                        Lo que se dijo en esta conversación. No se guarda al
                        salir.
                    </SheetDescription>
                </SheetHeader>
                <ol className="flex-1 space-y-4 overflow-y-auto p-4">
                    {mensajes.length === 0 && (
                        <li className="text-sm text-muted-foreground">
                            Todavía no hay mensajes.
                        </li>
                    )}
                    {mensajes.map((m) => (
                        <li
                            key={m.id}
                            className={cn(
                                'flex flex-col gap-2',
                                m.rol === 'usuario'
                                    ? 'items-end'
                                    : 'items-start',
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm text-pretty',
                                    m.rol === 'usuario'
                                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                                        : 'rounded-bl-sm bg-muted',
                                    m.error &&
                                        'bg-crit-soft text-crit-foreground',
                                )}
                            >
                                {m.texto}
                            </div>
                            {m.respuesta && (
                                <div className="flex flex-col items-start gap-2">
                                    <OrigenBadge origen="ia" />
                                    <DependenciasCitadas
                                        dependencias={
                                            m.respuesta.dependencias ?? []
                                        }
                                        sobreOscuro={false}
                                    />
                                    {m.respuesta.proveedores.length > 0 && (
                                        <div className="superficie-marca rounded-xl p-2">
                                            <ProveedoresCitados
                                                proveedores={
                                                    m.respuesta.proveedores
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ol>
            </SheetContent>
        </Sheet>
    );
}
