import { Link } from '@inertiajs/react';
import AppLogoMark from '@/components/app-logo-mark';
import { PILARES } from '@/components/brand-pillars';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

function Wordmark({ className }: { className?: string }) {
    return (
        <Link href={home()} className={className}>
            <AppLogoMark className="size-9" />
            <span className="text-xl font-bold tracking-tight">Unilyzer</span>
        </Link>
    );
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <aside className="superficie-marca relative hidden flex-col justify-between overflow-hidden border-r border-white/10 p-10 text-white lg:flex">
                <div
                    className="pointer-events-none absolute -bottom-40 -left-40 size-[34rem] rounded-full border-[48px] border-white/[0.04]"
                    aria-hidden
                />
                <Wordmark className="relative flex items-center gap-2.5" />
                <div className="relative max-w-md space-y-8">
                    <div className="space-y-3">
                        <p className="texto-degradado text-5xl leading-[1.05] font-semibold tracking-tight">
                            Cada experiencia cuenta.
                        </p>
                        <p className="text-white/70">
                            Plataforma inteligente de historial y evaluación de
                            proveedores de la UNI.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {PILARES.map(({ icono: Icono, titulo, texto }) => (
                            <li key={titulo} className="flex gap-3">
                                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-teal">
                                    <Icono className="size-4" aria-hidden />
                                </span>
                                <span className="text-sm">
                                    <span className="block font-medium">
                                        {titulo}
                                    </span>
                                    <span className="text-white/65">
                                        {texto}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-xs text-white/50">
                    Demo con proveedores ficticios · EncarBuild Night 2026
                </p>
            </aside>

            <main className="flex flex-col items-center justify-center gap-8 bg-background px-6 py-10">
                <Wordmark className="flex items-center gap-2 text-foreground lg:hidden" />
                <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-balance text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
