import { ScanSearch } from 'lucide-react';
import { ArchivoDropzone } from '@/components/dictamenes/archivo-dropzone';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { TextoExtraido } from '@/types';

const MAX_CARACTERES = 15_000;

type Props = {
    texto: string;
    documento: string;
    onTextoChange: (texto: string) => void;
    onDocumentoChange: (nombre: string) => void;
    onAnalizar: () => void;
    analizando: boolean;
};

export function DictamenInput({
    texto,
    documento,
    onTextoChange,
    onDocumentoChange,
    onAnalizar,
    analizando,
}: Props) {
    const usarArchivo = ({
        texto: leido,
        documento: nombre,
    }: TextoExtraido) => {
        onTextoChange(leido);
        onDocumentoChange(nombre);
    };

    const recortado = texto.length > MAX_CARACTERES;

    return (
        <div className="space-y-4">
            <ArchivoDropzone onTexto={usarArchivo} deshabilitado={analizando} />

            <div
                className="flex items-center gap-3 text-xs text-muted-foreground"
                aria-hidden
            >
                <span className="h-px flex-1 bg-border" />o pegá el texto
                <span className="h-px flex-1 bg-border" />
            </div>

            <FormField
                id="dictamen-texto"
                label="Texto del dictamen (anonimizado)"
            >
                <Textarea
                    id="dictamen-texto"
                    value={texto}
                    onChange={(e) => onTextoChange(e.target.value)}
                    placeholder="Pegá aquí el texto del dictamen, informe técnico o nota. Los datos sensibles deben estar anonimizados, por ejemplo [CONTRATISTA] o [MONTO]."
                    className="min-h-56 bg-card font-mono text-[13px] leading-relaxed"
                />
            </FormField>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span
                    className={recortado ? 'text-warn-foreground' : undefined}
                >
                    {texto.length.toLocaleString('es-PY')} caracteres
                    {recortado && ' · se analizarán los primeros 15.000'}
                </span>
                <span>No se guarda nada hasta que confirmes.</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FormField
                    id="documento-origen"
                    label="Nombre del documento"
                    className="flex-1"
                >
                    <Input
                        id="documento-origen"
                        value={documento}
                        onChange={(e) => onDocumentoChange(e.target.value)}
                        placeholder="Ej.: Dictamen DJ-118/2024"
                        className="bg-card"
                    />
                </FormField>
                <Button
                    type="button"
                    onClick={onAnalizar}
                    disabled={analizando || !texto.trim()}
                >
                    {analizando ? <Spinner /> : <ScanSearch />}
                    {analizando ? 'Analizando…' : 'Analizar con IA'}
                </Button>
            </div>
        </div>
    );
}
