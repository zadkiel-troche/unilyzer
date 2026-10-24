# unilyzer — Historia clínica del proveedor

> EncarBuild Night · Desafío 6: Historial de proveedores

## Problema

La experiencia con cada proveedor queda dispersa entre las dependencias de la UNI. Un proveedor puede cumplir formalmente un contrato y aun así entregar algo técnicamente deficiente.

**unilyzer** ayuda a las unidades de compras y a los administradores de contrato a decidir con quién contratar, consultando en lenguaje natural la _historia clínica_ de cada proveedor: contratos, atrasos, multas, reclamos, observaciones técnicas, satisfacción, reincidencias y una evaluación final explicada.

## Equipo

- Laura Vega
- Mauricio Segovia
- Zadkiel Troche

## Stack y herramientas de IA

- **Laravel 13** con el starter kit oficial de **React**: Inertia 3, React 19, TypeScript, Tailwind 4, shadcn/ui, Wayfinder y Fortify.
- **PostgreSQL** en Docker con **Laravel Sail**. Los tests corren en SQLite en memoria.
- **OpenAI** (`gpt-4.1-mini`), vía `/chat/completions` con Structured Outputs, para la búsqueda en lenguaje natural, la extracción de eventos desde dictámenes, los resúmenes y el asistente por voz.
- **Web Speech API** del navegador para hablar con la IA (reconocimiento y lectura en voz alta, sin dependencias).
- **smalot/pdfparser** para leer dictámenes en PDF.
- **Claude Code** como asistente de código.
- **Pest** para los tests.

## Instalación

Requisitos: PHP 8.4, Composer, Node ≥ 20.19 y Docker (Docker Desktop u OrbStack).

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# Editar .env y poner OPENAI_API_KEY (opcional: sin clave se usa búsqueda por palabras clave)
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm run dev
```

Abrir <http://localhost> e ingresar con `test@example.com` / `password`.

> Si usás Laravel Herd, el puerto 80 está ocupado: poné `APP_PORT=8080` y `APP_URL=http://localhost:8080` en `.env` y abrí <http://localhost:8080>.

Tests: `php artisan test`.

## Origen de los datos

- Todos los proveedores, contratos y eventos de los seeders son **ficticios**, inventados para la demo.
- Los dictámenes anonimizados del Drive del evento se usan solo para probar la extracción, de forma local en `docs-drive/`. **No** están en el repo.

## Estado

**Funciona hoy**

- Datos de prueba: 10 proveedores ficticios con contratos, eventos y evaluaciones.
- Evaluación final explicable (plazos, calidad, incidencias y reincidencia) con semáforo y detección de reincidencias.
- Búsqueda en lenguaje natural que muestra cómo se interpretó la pregunta y qué eventos respaldan cada resultado. Sin clave de OpenAI, cae a búsqueda por palabras clave y lo avisa.
- Historia clínica con puntaje explicado, línea de tiempo con la fuente de cada evento, tabla de contratos y resumen con IA que cita los eventos.
- Carga de dictámenes en PDF, Word, ODT, RTF, HTML o texto: la IA extrae los eventos con su cita textual, el usuario los revisa, agrega los que falten a mano y los guarda.
- "Hablar con la IA": asistente por voz con respuestas basadas en los registros.
- Interfaz en español, con modo oscuro y claro.

**Qué sigue**

- Embeddings para búsqueda semántica.
- Modelo local con Ollama.
- OCR para PDF escaneados.
- Roles por dependencia.
- Integración con sistemas de compras.

## Aviso

El repo no contiene claves ni datos personales. `OPENAI_API_KEY` va solo en `.env`, que no se versiona.
