import { FileUp, ScanSearch } from 'lucide-react';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

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
    const archivo = useRef<HTMLInputElement>(null);

    const cargarArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith('.txt')) {
            toast.error('Por ahora solo se aceptan archivos .txt.');

            return;
        }

        onTextoChange(await file.text());
        onDocumentoChange(file.name.replace(/\.txt$/i, ''));
    };

    const recortado = texto.length > MAX_CARACTERES;

    return (
        <div className="space-y-4">
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
                <input
                    ref={archivo}
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={cargarArchivo}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => archivo.current?.click()}
                >
                    <FileUp />
                    Subir .txt
                </Button>
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
