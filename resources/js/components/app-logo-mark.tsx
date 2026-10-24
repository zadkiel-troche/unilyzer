import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

/** Logo en su contenedor: cuadrado navy redondeado con el símbolo en turquesa. */
export default function AppLogoMark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'grid aspect-square size-8 shrink-0 place-items-center rounded-[28%] bg-brand-navy text-brand-teal ring-1 ring-white/10',
                className,
            )}
        >
            <AppLogoIcon className="size-[62%]" />
        </span>
    );
}
