# Historia clínica del proveedor — EncarBuild Night (Desafío 6)

> Este archivo es el contexto compartido del equipo para Claude Code. Va en la raíz del repo.
> Cada integrante trabaja en su rama y en sus carpetas (ver "División del trabajo").

## 1. Contexto

- **Evento:** EncarBuild Night (viernes 23-oct 18:00 → sábado 24-oct 05:00). Demo funcional con IA + repo público.
- **Tema 6 — Historial de proveedores.** Problema: la experiencia con cada proveedor queda dispersa entre dependencias de una universidad pública (UNI). Un proveedor puede cumplir formalmente un contrato y aun así entregar algo técnicamente deficiente.
- **Frase guía:** "Ayudamos a las unidades de compras y administradores de contrato de la UNI a decidir con quién contratar, consultando la historia clínica de cada proveedor en lenguaje natural."
- **La historia clínica muestra:** contratos ejecutados, tiempos de entrega, cumplimiento de plazos, calidad, reclamos, observaciones técnicas, satisfacción de la unidad solicitante, reincidencias y evaluación final.

### Reglas del evento que el código DEBE respetar

- **Datos:** solo documentos anonimizados del Drive (como prueba, NO se suben al repo), datos abiertos citados o datos inventados. Nada de datos personales reales. Todos los proveedores del seeder son **ficticios** y así se marcan.
- **Seguridad:** nunca commitear claves. `OPENAI_API_KEY` solo en `.env` (ya está en `.gitignore`). La carpeta `docs-drive/` (dictámenes locales para probar) va en `.gitignore`.
- **La IA puede equivocarse:** cada dato extraído o respuesta generada muestra su fuente (extracto del documento o eventos citados) y cómo se interpretó la pregunta.
- **Alcance:** mejor algo chico que funciona. Si algo no llega, se pasa a "Qué sigue" en el README.
- **README obligatorio** (ver sección 9).

## 2. Stack (no cambiar)

- **Laravel 13 + React starter kit oficial** (`laravel new` → React): Inertia 3, React 19, TypeScript, Tailwind 4, shadcn/ui (ya trae `card`, `badge`, `button`, `input`, `select`, `dialog`, `skeleton`, `spinner`, `sonner`), Wayfinder, auth con Fortify.
- **Base de datos:** PostgreSQL en Docker vía **Laravel Sail** (`laravel/sail` como dependencia dev, `compose.yaml` con `laravel.test` + `pgsql`). Los tests usan SQLite `:memory:` (`phpunit.xml`), así que el SQL debe ser portable.
- **Node:** ≥ 20.19 (el starter usa Vite+ / `vp`). Con Node 18 falla.
- **IA:** OpenAI vía `Illuminate\Support\Facades\Http` contra `/chat/completions` con **Structured Outputs** (`response_format: { type: "json_schema", strict: true }`). Sin SDK extra.
- **Gráficos:** barras simples con divs + Tailwind. No agregar librerías salvo que sea imprescindible.
- **Sin dependencias nuevas** de Composer ni npm sin acordarlo con el equipo. Acordadas: `smalot/pdfparser` (leer dictámenes en PDF).
- **Voz:** Web Speech API del navegador (reconocimiento y lectura en voz alta), sin librerías.

### Variables de entorno (agregar a `.env.example` sin valores)

```
APP_NAME="Historia Clínica del Proveedor"
APP_LOCALE=es
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

`config/services.php` → `'openai' => ['key' => env('OPENAI_API_KEY'), 'model' => env('OPENAI_MODEL', 'gpt-4.1-mini'), 'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1')]`.

**Modo sin clave (obligatorio):** si no hay `OPENAI_API_KEY` o la API falla, la búsqueda cae a búsqueda por palabras clave y la UI lo indica con un aviso. La demo nunca debe romperse por la clave.

## 3. Modelo de datos

Una migración: `create_historial_proveedores_tables`.

| Tabla | Campos |
|---|---|
| `dependencias` | id, nombre, sigla (nullable), timestamps |
| `proveedores` | id, nombre, ruc (nullable), rubro, ficticio (bool, default true), timestamps |
| `contratos` | id, proveedor_id (FK cascade), dependencia_id (FK nullable), codigo (nullable), objeto, monto decimal(16,2) nullable, fecha_inicio, fecha_fin_pactada, fecha_fin_real (todas date nullable), estado (`en_ejecucion` \| `finalizado` \| `rescindido`), timestamps |
| `eventos` | id, contrato_id (FK cascade), tipo, fecha (nullable), dias int nullable, monto decimal nullable, categoria (nullable), descripcion text, extracto_fuente text nullable, documento_origen (nullable), extraido_por_ia bool default false, timestamps |
| `evaluaciones` | id, contrato_id (FK cascade), dependencia_id (FK nullable), calidad tinyint 1-5, satisfaccion tinyint 1-5, comentario text nullable, timestamps |

- **Tipos de evento:** `atraso`, `multa`, `prorroga`, `reclamo`, `observacion_tecnica`, `ampliacion`, `terminacion`, `cambio_administrativo`, `recepcion_conforme`.
- **Negativos** (cuentan como incidencias): `atraso`, `multa`, `reclamo`, `observacion_tecnica`, `terminacion`.
- **Categorías sugeridas** (para detectar reincidencias): `plazo`, `calidad`, `materiales`, `documentacion`, `seguridad`, `atencion`, `clima`.

**Modelos:** `Dependencia`, `Proveedor` (con `$table = 'proveedores'`; relaciones `contratos`, `eventos` hasManyThrough, `evaluaciones` hasManyThrough), `Contrato` (método `diasAtraso()` = max(0, fin_real − fin_pactada)), `Evento`, `Evaluacion` (`$table = 'evaluaciones'`). Ojo: Laravel pluraliza en inglés, hay que fijar `$table` en todos.

## 4. Evaluación final (ScoringService)

`app/Services/ScoringService.php` → `calcular(Proveedor $p): array` (el proveedor llega con `contratos.eventos` y `contratos.evaluaciones` cargados). Todo explicable: cada componente devuelve `puntaje` (0-100) y `motivo` (texto).

| Componente | Peso | Cálculo |
|---|---|---|
| Plazos | 35% | % de contratos cerrados sin atraso (fin_real > pactada o evento `atraso`). −15 si atraso promedio > 30 días. Sin contratos cerrados → 70 neutro. |
| Calidad | 35% | promedio de (calidad + satisfaccion)/2, escalado de 1-5 a 0-100. Sin evaluaciones → 60 neutro. |
| Incidencias | 20% | 100 − 2 × (reclamos·12 + multas·15 + observaciones·8 + terminaciones·50) / n_contratos, mínimo 0. |
| Reincidencia | 10% | 100 − 35 × cantidad de reincidencias. **Reincidencia** = mismo `tipo + categoria` negativo en 2 o más contratos distintos. |

- **Semáforo:** ≥75 verde "Confiable" · 50-74 amarillo "Con observaciones" · <50 rojo "Crítico".
- **Devuelve:** `{ puntaje, semaforo: {nivel, etiqueta}, componentes: {plazos, calidad, incidencias, reincidencia}, metricas: {...}, reincidencias: [{tipo, categoria, contratos, veces, eventos: [ids], descripcion}] }`.
- **Métricas:** contratos, finalizados, rescindidos, monto_total, contratos_con_atraso, atraso_promedio_dias, atrasos, multas, monto_multas, reclamos, observaciones_tecnicas, prorrogas, ampliaciones, terminaciones, calidad_promedio, satisfaccion_promedio.

## 5. Servicios de IA (`app/Services/Ai/`)

### `OpenAiClient`

`json(string $system, string $user, string $schemaName, array $schema): array`.
- POST a `{base_url}/chat/completions` con `model`, `messages`, `response_format` json_schema strict. Timeout 60 s. Sin `temperature` (algunos modelos no lo aceptan).
- Lanza `AiUnavailableException` si no hay clave o falla, para que los llamadores hagan fallback.
- Recordatorio de strict mode: todas las propiedades en `required`, `additionalProperties: false` y nulos como `"type": ["string","null"]`.

### A) `BusquedaService` — lenguaje natural a filtros

`buscar(string $q): array` → `{ modo: "ia"|"palabras_clave", interpretacion, filtros, resultados: [...] }`.

1. El LLM recibe la pregunta y, en el system prompt, la lista real de rubros, dependencias, tipos y categorías existentes en la BD, más la fecha de hoy.
2. Devuelve este JSON (schema strict):

```json
{
  "interpretacion": "Proveedores del rubro obras con al menos una multa desde 2024",
  "filtros": {
    "texto": null,
    "rubro": "obras",
    "dependencia": null,
    "tipos_evento": ["multa"],
    "categoria": null,
    "desde": "2024-01-01",
    "hasta": null,
    "sin_atrasos": null,
    "satisfaccion_max": null,
    "puntaje_min": null,
    "puntaje_max": null,
    "solo_reincidentes": null,
    "orden": "puntaje_asc",
    "limite": 10
  }
}
```

   `orden` ∈ `puntaje_asc` | `puntaje_desc` | `incidencias_desc` | `null`.
3. Laravel **valida** los filtros (valores dentro de las listas permitidas) y los aplica con Eloquent más filtrado en PHP sobre el puntaje calculado. El dataset es chico, así que alcanza.
4. Cada resultado devuelve `{ id, nombre, rubro, puntaje, semaforo, motivo, eventos_coincidentes: [{id, tipo, fecha, descripcion}] }`. `motivo` se arma en PHP a partir de los conteos que hicieron coincidir el filtro, por ejemplo "3 multas desde 2024, satisfacción 2.1/5".
5. **Fallback:** si la IA no está disponible, se hace un LIKE de las palabras sobre nombre, rubro, `contratos.objeto` y `eventos.descripcion`, con `modo: "palabras_clave"`.

**Consultas que tienen que funcionar en la demo:**
- "proveedores de obras con multas por atraso desde 2024"
- "¿quién cumplió los plazos pero tuvo problemas de calidad?" → `sin_atrasos: true`, `satisfaccion_max: 3`
- "proveedores con reclamos repetidos" → `solo_reincidentes: true`, `tipos_evento: ["reclamo"]`
- "los mejores proveedores de informática" → `rubro: "informatica"`, `orden: "puntaje_desc"`

### B) `ExtractorService` — dictamen a eventos

`analizar(string $texto): array`. Recorta el texto a unos 15 000 caracteres. Devuelve:

```json
{
  "proveedor_mencionado": "[CONTRATISTA]",
  "contrato": { "codigo": null, "objeto": "...", "monto": null, "fecha_inicio": null, "fecha_fin_pactada": null },
  "dependencia_mencionada": null,
  "resumen": "Dictamen que recomienda aplicar multa por 12 días de atraso...",
  "eventos": [
    { "tipo": "multa", "fecha": "2024-05-10", "dias": 12, "monto": null, "categoria": "plazo",
      "descripcion": "Multa por atraso en la entrega final de obra",
      "extracto_fuente": "…se aplica multa por 12 días de atraso…" }
  ]
}
```

- **Prompt:** los documentos están anonimizados (`[CONTRATISTA]`, `[MONTO]`, etc.). No inventar datos: si un valor no aparece, va `null`. `extracto_fuente` es una cita textual corta (máximo unas 30 palabras) del documento.
- La extracción **no guarda nada**: el usuario revisa y confirma en la UI.

### C) `ResumenService` — resumen de la historia clínica

`generar(Proveedor $p, array $score): array`. El LLM recibe un JSON compacto con los contratos, los eventos (con id) y las evaluaciones. Devuelve:

```json
{ "resumen": "...", "fortalezas": ["..."], "alertas": ["..."],
  "recomendacion": "contratar | contratar con condiciones | evitar",
  "eventos_citados": [12, 15] }
```

- Prompt: basarse solo en los datos recibidos y citar ids de eventos.
- Cachear con `Cache::remember` usando como clave el proveedor más el `max(updated_at)` de sus eventos.

### D) `AsistenteService` — "Hablar con la IA"

`responder(string $mensaje, array $historial): array`. Contrato en `resources/js/types/asistente.ts`:

```json
// Solicitud
{ "mensaje": "¿Qué pasó con la Constructora Paraná?", "historial": [{ "rol": "usuario|asistente", "texto": "..." }] }
// Respuesta
{ "modo": "ia|palabras_clave", "respuesta": "texto apto para leer en voz alta",
  "proveedores": [{ "id", "nombre", "rubro", "puntaje", "semaforo", "motivo" }],
  "dependencias": [{ "id", "nombre", "sigla", "contratos", "proveedores", "monto_total", "por_estado": { "en_ejecucion", "finalizado", "rescindido" } }],
  "eventos_citados": [12] }
```

- La IA recibe una ficha compacta de todos los proveedores (el dataset es chico) y responde en una sola llamada: importa la latencia en voz.
- `respuesta`: 2-4 oraciones cortas, sin markdown, ids ni símbolos. Los ids devueltos se validan contra la base.
- **Preguntas de conteo** ("¿qué dependencias tienen más contratos?", "¿cuál tiene menos proveedores?", "¿cuántos contratos hay por estado?"): la IA recibe `EstadisticasService` (por dependencia y por estado) y devuelve `dependencias_ids`; la UI muestra la tabla con los números.
- Sin IA: responde con la búsqueda por palabras clave (`modo: "palabras_clave"`) y detecta las preguntas de conteo con reglas simples.

## 6. Rutas y controladores

Todas dentro del grupo `auth` existente (`routes/web.php`). El usuario de prueba del seeder es `test@example.com` / `password`.

| Método | Ruta | Controlador | Respuesta |
|---|---|---|---|
| GET | `/dashboard` | `DashboardController` | Inertia `dashboard` (reemplaza el placeholder) |
| GET | `/proveedores` | `ProveedorController@index` | Inertia `proveedores/index` |
| GET | `/proveedores/{proveedor}` | `ProveedorController@show` | Inertia `proveedores/show` |
| POST | `/proveedores/{proveedor}/resumen` | `ProveedorController@resumen` | JSON (ResumenService) |
| POST | `/busqueda` | `BusquedaController` | JSON (BusquedaService) |
| GET | `/dictamenes/cargar` | `DictamenController@create` | Inertia `dictamenes/cargar` (proveedores y dependencias para los selects) |
| POST | `/dictamenes/extraer-texto` | `Dictamenes\ExtraerTextoController` | JSON `{texto, documento, formato, caracteres}`: lee PDF, DOCX, ODT, RTF, HTML o texto. No guarda el archivo |
| POST | `/dictamenes/analizar` | `DictamenController@analizar` | JSON (ExtractorService); 503 si no hay IA |
| POST | `/dictamenes/confirmar` | `DictamenController@confirmar` | Redirect a `proveedores/{id}` con flash |
| GET | `/asistente` | `AsistenteController@index` | Inertia `asistente` |
| POST | `/asistente` | `AsistenteController@responder` | JSON (AsistenteService) |

- **`confirmar` recibe:** `{ proveedor_id | null, proveedor_nuevo: {nombre, rubro} | null, contrato_id | null, contrato_nuevo: {...} | null, dependencia_id, documento_origen, eventos: [...] }`. Valida con `ConfirmarDictamenRequest`. Cada evento trae su propio `extraido_por_ia` (`false` si el usuario lo agregó a mano) y se guarda tal cual.
- **Formas de las respuestas:** las arma `app/Services/ProveedorPresenter.php` según `resources/js/types/proveedores.ts`. Si cambia una, se cambian los dos juntos.
- **Props de `proveedores/show`:** `proveedor`, `score` (ScoringService completo), `contratos` (con dependencia, eventos y evaluaciones), `timeline` (todos los eventos ordenados por fecha con el código de contrato).
- **CSRF en las llamadas JSON:** el frontend usa `fetch` con el header `X-XSRF-TOKEN`, leído de la cookie `XSRF-TOKEN` con `decodeURIComponent`. Crear el helper `resources/js/lib/api.ts` con `postJson<T>(url, body)`.

## 7. Frontend (React + Inertia)

El layout `AppLayout` se aplica solo a todas las páginas. Los breadcrumbs se definen con `Pagina.layout = { breadcrumbs: [...] }`, igual que en `dashboard.tsx`. En el sidebar (`app-sidebar.tsx`) reemplazar los items por **Panel**, **Proveedores** y **Cargar dictamen**, y quitar los links "Repository" y "Documentation" del footer.

Tipos en `resources/js/types/proveedores.ts` (exportarlos desde `types/index.ts`).

1. **`dashboard.tsx` (Panel):**
   - KPIs: proveedores, contratos, monto total, reclamos.
   - Ranking de los 5 proveedores más críticos y los 5 más confiables, con semáforo.
   - Barra de búsqueda grande que lleva a `/proveedores?q=...`.
2. **`proveedores/index.tsx`:**
   - Buscador en lenguaje natural con chips de las 4 consultas de ejemplo.
   - Al buscar: `postJson('/busqueda')`, spinner, y luego una caja "Así entendí tu pregunta" con `interpretacion` y los filtros como badges.
   - Lista de resultados: nombre, rubro, puntaje, semáforo, `motivo` y eventos coincidentes.
   - Sin búsqueda: todos los proveedores ordenados por puntaje.
   - Aviso visible si `modo === "palabras_clave"`.
3. **`proveedores/show.tsx` (la historia clínica):**
   - Encabezado con nombre, rubro, badge "Ficticio", puntaje grande con semáforo y desglose de los 4 componentes (barra más motivo).
   - Fila de métricas: contratos, % a tiempo, atraso promedio, multas, reclamos, observaciones técnicas, satisfacción.
   - Alertas de reincidencia destacadas.
   - Botón "Generar resumen con IA": muestra resumen, fortalezas, alertas y recomendación. Los ids citados se muestran como links que hacen scroll al evento.
   - Línea de tiempo de eventos con ícono por tipo, fecha, contrato, descripción, extracto de fuente desplegable y badge "Extraído por IA".
   - Tabla de contratos con estado, fechas pactada/real, días de atraso y evaluación.
4. **`dictamenes/cargar.tsx`:**
   - Textarea para pegar el dictamen (o subir un `.txt`) y el botón "Analizar".
   - Vista previa editable de los eventos extraídos: tipo, fecha, días, categoría, descripción, extracto. Se puede quitar o editar cada uno.
   - Select de proveedor (existente o nuevo), contrato (existente del proveedor o nuevo) y dependencia.
   - Botón "Guardar en el historial", que redirige a la historia clínica.

**Estilo:** sobrio e institucional, en español, con los colores del semáforo como único acento fuerte y modo oscuro funcionando (el starter ya lo soporta).

## 8. Datos de prueba (seeders)

- `DependenciaSeeder`: unas 6 dependencias ficticias, por ejemplo Facultad de Ingeniería, Facultad de Ciencias Médicas, Dirección de Infraestructura, Dirección de TIC, Rectorado y Facultad de Ciencias Económicas.
- `ProveedorSeeder`: **10 proveedores ficticios** con perfiles armados a mano y deterministas (sin aleatoriedad), de 2 a 5 contratos cada uno entre 2023 y 2026. Los perfiles cubren los casos de la demo:

| Proveedor (ficticio) | Rubro | Perfil |
|---|---|---|
| Constructora Paraná Obras S.A. | obras | Atrasos recurrentes, prórrogas por lluvia, 2 multas, 1 rescisión por incumplimientos reiterados → **rojo** |
| TecnoSur Informática | informatica | Todo a tiempo, buena calidad → **verde** |
| Limpieza Integral Itapúa | limpieza | Reclamos de calidad en 3 contratos (reincidencia) → **amarillo** |
| Mobiliario del Sur | mobiliario | **Cumplió formalmente** (a tiempo, recepción conforme) pero observaciones técnicas de materiales y satisfacción 2/5 → caso estrella de la demo |
| LabQuímica Insumos | insumos_laboratorio | Atrasos leves, calidad buena → verde/amarillo |
| Seguridad Total S.R.L. | seguridad | Reclamo grave más multa → amarillo |
| Eléctrica Encarnación | mantenimiento_electrico | Ampliación de monto y plazo justificada, buena calidad → verde |
| Catering Universitario | alimentos | Satisfacción variable entre dependencias → amarillo |
| Redes y Datos PY | informatica | Atraso más sustitución de materiales y observación técnica → amarillo |
| Vial Constructora del Este | obras | Obras a tiempo, buena evaluación → verde |

- Eventos con descripciones realistas, inspiradas en el tipo de dictámenes del Drive (multas por atraso con días calculados, prórrogas por lluvia, convenios modificatorios, cambio de administrador de contrato) pero **redactadas desde cero**. Nunca copiar texto de los documentos del Drive.
- `DatabaseSeeder` mantiene el usuario de prueba y llama a los dos seeders.

## 9. README (lo pide la guía)

Debe incluir:
- Tema elegido y problema que resuelve (2-3 líneas).
- Integrantes del equipo.
- Stack y herramientas de IA usadas: OpenAI (modelo), Claude Code como asistente de código y las librerías.
- Instalación paso a paso (requiere Docker): `composer install`, `npm install`, `cp .env.example .env`, `php artisan key:generate`, poner `OPENAI_API_KEY`, `./vendor/bin/sail up -d`, `./vendor/bin/sail artisan migrate --seed`, `./vendor/bin/sail npm run dev`, abrir `http://localhost` y login con `test@example.com` / `password`.
- Origen de los datos: proveedores ficticios inventados; los dictámenes anonimizados del Drive se usan solo para probar y **no** están en el repo.
- Qué funciona hoy y qué harían después:
  - Embeddings para búsqueda semántica.
  - Modelo local con Ollama (tema 8).
  - Carga de PDF.
  - Roles por dependencia.
  - Integración con sistemas de compras.
- Aviso: sin claves ni datos personales en el repo.

## 10. División del trabajo (3 personas)

Cada uno en su rama y en sus archivos, para evitar conflictos. Merge a `main` en cada hito.

| | Persona A — Backend y datos | Persona B — IA | Persona C — Frontend |
|---|---|---|---|
| Rama | `feat/backend` | `feat/ia` | `feat/frontend` |
| Archivos | `database/**`, `app/Models/**`, `app/Services/ScoringService.php`, `app/Http/Controllers/**`, `app/Http/Requests/**`, `routes/web.php` | `app/Services/Ai/**`, `config/services.php`, `.env.example` | `resources/js/**` |
| Primero | Migración, modelos, seeders, `ScoringService` | `OpenAiClient`, `BusquedaService` con fallback | `lib/api.ts`, tipos, sidebar, `proveedores/index` con datos mock |
| Después | Controladores, rutas, FormRequest de confirmar | `ExtractorService` (probar con 3-4 dictámenes del Drive en `docs-drive/`), `ResumenService` | `proveedores/show`, `dictamenes/cargar`, `dashboard` |
| Cierre | Revisar seeders para que la demo cuente la historia | Afinar prompts con las 4 consultas de la demo | README y video de respaldo de 1-2 min |

**Contrato entre personas:** los JSON de las secciones 4, 5 y 6 son la interfaz. Si alguien necesita cambiar una forma, avisa al equipo antes.

## 11. Hitos

1. **H1 — Base (todos, ~20 min):** crear el proyecto con el starter kit, commit inicial, este `CLAUDE.md`, `.gitignore` con `docs-drive/`, crear las ramas.
2. **H2 — Punta a punta mínimo:** seeders cargados más búsqueda en lenguaje natural mostrando resultados en `proveedores/index`. **Merge a main.**
3. **H3 — Historia clínica:** `proveedores/show` completo con puntaje explicado y timeline. **Merge.**
4. **H4 — Carga de dictamen:** analizar, revisar y guardar, y que el evento aparezca en la historia clínica. **Merge.**
5. **H5 — Pulido:** resumen con IA, dashboard, textos y modo oscuro.
6. **Congelar código 1 h antes de presentar:** README, repo público, video de respaldo y ensayo de demo de 3 minutos.

### Guion de demo (3 min)

1. **Problema** (30 s): la experiencia con proveedores queda dispersa entre dependencias.
2. **Búsqueda** (40 s): "¿quién cumplió los plazos pero tuvo problemas de calidad?" → aparece Mobiliario del Sur y se muestra cómo se entendió la pregunta.
3. **Historia clínica** (60 s): puntaje explicado, reincidencias, timeline con fuentes y resumen con IA.
4. **Carga de un dictamen** (40 s): pegar un dictamen anonimizado → eventos extraídos con su extracto → guardar → el puntaje cambia.
5. **Qué sigue** (10 s).

## 12. Reglas para Claude Code en este repo

- Preguntar antes de asumir decisiones que no estén en este archivo.
- No agregar dependencias nuevas sin confirmarlo.
- No commitear `.env`, claves ni archivos de `docs-drive/`.
- Mantener los nombres de tablas y campos en español, tal como están en este documento.
- Antes de dar algo por terminado, correr:
  - `./vendor/bin/sail artisan migrate:fresh --seed`
  - `./vendor/bin/sail artisan test` (o `php artisan test`, usa SQLite en memoria)
  - `npm run types:check`
  - `npm run build`
- Mensajes de UI en español.
