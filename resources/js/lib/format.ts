const LOCALE = 'es-PY';

const monto = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
});

const montoCompacto = new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const entero = new Intl.NumberFormat(LOCALE);

const fecha = new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
});

export function formatMonto(valor: number | null): string {
    return valor === null ? '—' : monto.format(valor);
}

/** Monto abreviado para KPIs: "Gs. 13,9 mil M". */
export function formatMontoCompacto(valor: number): string {
    return `Gs. ${montoCompacto.format(valor)}`;
}

export function formatNumero(valor: number): string {
    return entero.format(valor);
}

/** Las fechas llegan como "YYYY-MM-DD"; se interpretan en UTC para no correr el día. */
export function formatFecha(valor: string | null): string {
    return valor ? fecha.format(new Date(`${valor}T00:00:00Z`)) : '—';
}

export function formatDias(dias: number | null): string {
    if (dias === null) {
        return '—';
    }

    return dias === 1 ? '1 día' : `${formatNumero(dias)} días`;
}

export function formatNota(valor: number | null): string {
    return valor === null ? '—' : `${valor.toFixed(1).replace('.', ',')}/5`;
}

export function porcentaje(parte: number, total: number): number {
    return total === 0 ? 0 : Math.round((parte / total) * 100);
}
