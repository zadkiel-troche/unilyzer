import AppLogoMark from '@/components/app-logo-mark';

export default function AppLogo() {
    return (
        <>
            <AppLogoMark />
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-[15px] leading-tight font-bold tracking-tight">
                    Unilyzer
                </span>
                <span className="truncate text-[11px] leading-tight text-sidebar-foreground/70">
                    Cada experiencia cuenta.
                </span>
            </div>
        </>
    );
}
