# unilyzer — Historia clínica del proveedor

> EncarBuild Night · Desafío 6: Historial de proveedores

## Problema

La experiencia con cada proveedor queda dispersa entre las dependencias de la UNI. Un proveedor puede cumplir formalmente un contrato y aun así entregar algo técnicamente deficiente.

**unilyzer** ayuda a las unidades de compras y a los administradores de contrato a decidir con quién contratar, consultando en lenguaje natural la *historia clínica* de cada proveedor: contratos, atrasos, multas, reclamos, observaciones técnicas, satisfacción, reincidencias y una evaluación final explicada.

## Equipo

- _(completar)_
- _(completar)_
- _(completar)_

## Stack y herramientas de IA

- **Laravel 13** con el starter kit oficial de **React**: Inertia 3, React 19, TypeScript, Tailwind 4, shadcn/ui, Wayfinder y Fortify.
- **PostgreSQL** en Docker con **Laravel Sail**. Los tests corren en SQLite en memoria.
- **OpenAI** (`gpt-4.1-mini`), vía `/chat/completions` con Structured Outputs, para la búsqueda en lenguaje natural, la extracción de eventos desde dictámenes y los resúmenes.
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

Tests: `php artisan test`.

## Origen de los datos

- Todos los proveedores, contratos y eventos de los seeders son **ficticios**, inventados para la demo.
- Los dictámenes anonimizados del Drive del evento se usan solo para probar la extracción, de forma local en `docs-drive/`. **No** están en el repo.

## Estado

**Funciona hoy**
- Setup base: Laravel + React, Sail con PostgreSQL y autenticación.

**En desarrollo**
- Modelo de datos y seeders con 10 proveedores ficticios.
- Evaluación final explicable (plazos, calidad, incidencias, reincidencia) con semáforo.
- Búsqueda en lenguaje natural con fallback por palabras clave.
- Historia clínica con línea de tiempo, fuentes y resumen con IA.
- Carga de dictámenes: extracción de eventos con IA, revisión y guardado.

**Qué sigue**
- Embeddings para búsqueda semántica.
- Modelo local con Ollama.
- Carga de PDF.
- Roles por dependencia.
- Integración con sistemas de compras.

## Aviso

El repo no contiene claves ni datos personales. `OPENAI_API_KEY` va solo en `.env`, que no se versiona.
