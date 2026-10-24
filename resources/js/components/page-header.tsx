import type { ReactNode } from 'react';

type Props = {
    title: string;
    description?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
};

export function PageHeader({ title, description, eyebrow, actions }: Props) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1.5">
                {eyebrow && (
                    <div className="flex flex-wrap items-center gap-2">
                        {eyebrow}
                    </div>
                )}
                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                    {title}
                </h1>
                {description && (
                    <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
            )}
        </header>
    );
}
