import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/15">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-[15px] leading-tight font-semibold tracking-tight">
                    Unilyzer
                </span>
                <span className="truncate text-[11px] leading-tight text-sidebar-foreground/70">
                    Cada experiencia cuenta.
                </span>
            </div>
        </>
    );
}
