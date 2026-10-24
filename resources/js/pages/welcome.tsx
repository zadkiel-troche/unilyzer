import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Lightbulb, Search, Sparkles } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { PILARES } from '@/components/brand-pillars';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

/** Ilustración estática del producto: una pregunta, su interpretación y un resultado. */
function VistaPrevia() {
    return (
        <div className="relative w-full max-w-lg" aria-hidden>
            <div className="absolute -inset-6 rounded-[2rem] bg-brand-action/10 blur-2xl dark:bg-brand-teal/10" />
            <div className="relative space-y-3 rounded-2xl border bg-card p-4 shadow-xl shadow-brand-navy/5">
                <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm">
                    <Search className="size-4 text-muted-foreground" />
                    <span>
                        ¿Quién cumplió los plazos pero tuvo problemas de
                        calidad?
                    </span>
                </div>
                <div className="rounded-xl border p-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                            <Lightbulb className="size-3.5 text-ai" />
                            Así entendí tu pregunta
                        </span>
                        <span className="flex items-center gap-1 rounded-md bg-ai-soft px-1.5 py-0.5 font-medium text-ai">
                            <Sparkles className="size-3" /> IA
                        </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-md border px-2 py-0.5">
                            Sin atrasos
                        </span>
                        <span className="rounded-md border px-2 py-0.5">
                            Satisfacción ≤ 3/5
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-3">
                    <span className="grid size-11 place-items-center rounded-full border-4 border-warn text-sm font-semibold">
                        70
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                        <div className="font-semibold">Mobiliario del Sur</div>
                        <div className="truncate text-xs text-muted-foreground">
                            0 atrasos en 3 contratos, pero satisfacción 2/5 y 3
                            observaciones técnicas
                        </div>
                    </div>
                    <span className="rounded-md bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn-foreground">
                        Con observaciones
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;
    const destino = auth.user ? dashboard() : login();

    return (
        <>
            <Head title="Cada experiencia cuenta" />
            <div className="flex min-h-dvh flex-col bg-background">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-brand-navy dark:text-white"
                    >
                        <AppLogoIcon className="size-7" />
                        <span className="text-lg font-semibold tracking-tight">
                            Unilyzer
                        </span>
                    </Link>
                    <Button
                        asChild
                        variant={auth.user ? 'default' : 'outline'}
                        size="sm"
                    >
                        <Link href={destino}>
                            {auth.user ? 'Ir al panel' : 'Ingresar'}
                        </Link>
                    </Button>
                </header>

                <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-2 lg:py-16">
                    <section className="space-y-6">
                        <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                            <span
                                className="size-1.5 rounded-full bg-brand-teal"
                                aria-hidden
                            />
                            Historial de proveedores · UNI
                        </p>
                        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-brand-navy sm:text-5xl dark:text-white">
                            Cada experiencia cuenta.
                        </h1>
                        <p className="max-w-lg text-lg text-pretty text-muted-foreground">
                            Unilyzer reúne contratos, atrasos, reclamos,
                            observaciones técnicas y evaluaciones de todas las
                            dependencias para que la institución consulte la
                            historia clínica de cada proveedor antes de decidir.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild size="lg">
                                <Link href={destino}>
                                    {auth.user
                                        ? 'Consultar proveedores'
                                        : 'Ingresar a la plataforma'}
                                    <ArrowRight />
                                </Link>
                            </Button>
                        </div>
                    </section>
                    <div className="flex justify-center lg:justify-end">
                        <VistaPrevia />
                    </div>
                </main>

                <section
                    aria-label="Cómo funciona"
                    className="border-t bg-card"
                >
                    <ul className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
                        {PILARES.map(({ icono: Icono, titulo, texto }) => (
                            <li key={titulo} className="space-y-2">
                                <span className="grid size-10 place-items-center rounded-xl bg-brand-navy text-brand-teal">
                                    <Icono className="size-5" aria-hidden />
                                </span>
                                <h2 className="font-semibold">{titulo}</h2>
                                <p className="text-sm text-pretty text-muted-foreground">
                                    {texto}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>

                <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-muted-foreground">
                    Demostración con proveedores ficticios. La IA puede
                    equivocarse: cada resultado muestra su fuente.
                </footer>
            </div>
        </>
    );
}
