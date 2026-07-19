# Colibrí

Aplicacion full stack para una tienda de abarrotes construida con Next.js.

Produccion: https://tiendacolibri.vercel.app

La app tiene dos caras:
1. Cliente: navegar la jerarquia de categorias (Departamento -> Categoria -> Subcategoria), armar carrito y crear pedido.
2. Admin: gestionar categorias y productos, y aprobar/completar ordenes (el inventario se descuenta al aprobar).

Tambien tiene modo demo (fallback) para mantener navegabilidad cuando la base de datos no responde.

## Stack

- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL (Neon)
- Better Auth (autenticacion)
- Tailwind CSS
- Zustand + SWR
- Zod
- Cloudinary (imagenes)

## Funcionalidades

- Jerarquia de categorias en 3 niveles (Departamento, Categoria, Subcategoria con codigo).
- Importacion de categorias por CSV (upsert reejecutable).
- Catalogo por categorias con carrito lateral; los agotados se ocultan.
- Creacion de orden desde el cliente.
- Panel admin para categorias, productos e inventario.
- Aprobacion de ordenes con descuento de stock.
- Validacion de payloads con Zod.
- Sync entre vistas con SWR + eventos.
- Fallback demo configurable por entorno.

## Arquitectura (resumen)

- UI y rutas: App Router (`app/`)
- Autenticacion: Better Auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`)
- Proteccion de rutas `/admin`: `proxy.ts`
- Mutaciones de ordenes:
1. `POST /order/api`
2. `POST /admin/orders/api/complete`
- Lectura de ordenes:
1. `GET /admin/orders/api`
2. `GET /orders/api`
- Prisma client compartido en `src/lib/prisma.ts`

## Instalacion local

1. Clonar repo

```bash
git clone https://github.com/helaenrose/colibri.git
cd colibri
```

2. Instalar dependencias

```bash
npm install
```

3. Crear `.env` (puedes copiar `.env.template`)

```bash
# Base de datos PostgreSQL (Neon)
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# Autenticacion (genera un secreto con: openssl rand -base64 32)
BETTER_AUTH_SECRET=
# Opcional: URL base de auth (fallback a la URL de Vercel en produccion)
BETTER_AUTH_URL=

# Cloudinary: una sola variable con las tres credenciales (Panel -> API environment variable)
# Formato: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_URL=
# Opcional: solo si usas el widget de subida del formulario de productos (lado cliente)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Opcional (default: 8000)
DB_QUERY_TIMEOUT_MS=8000

# Opcional: en produccion queda false por defecto
DEMO_FALLBACK_ENABLED=false

# Acceso de emergencia para rutas /admin (no reemplaza el login real)
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASSWORD=tu_password_segura

# Opcional: admin inicial que crea el seed (valores por defecto abajo)
ADMIN_EMAIL=admin@colibri.com
ADMIN_PASSWORD=admin1234
ADMIN_NAME=Administrador
```

4. Generar Prisma Client y aplicar el esquema

```bash
npx prisma generate
npx prisma db push
```

5. Sembrar datos (categorias, productos y admin inicial)

```bash
npx tsx prisma/seed.ts
npx tsx prisma/seed-admin.ts
```

6. Levantar proyecto

```bash
npm run dev
```

7. Abrir

```text
http://localhost:3000
```

## Scripts

- `npm run dev`: desarrollo
- `npm run build`: `prisma generate` + build de produccion
- `npm run start`: correr build
- `npm run lint`: lint con ESLint

## Variables de entorno importantes

- `DATABASE_URL`: conexion PostgreSQL/Neon con pooling (obligatoria)
- `DATABASE_URL_UNPOOLED`: conexion directa sin pooling (obligatoria)
- `BETTER_AUTH_SECRET`: secreto para firmar sesiones (obligatoria)
- `BETTER_AUTH_URL`: URL base de auth (opcional, fallback a la URL de Vercel)
- `CLOUDINARY_URL`: credenciales de Cloudinary en una sola cadena `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (obligatoria para subir comprobantes/imagenes desde el servidor)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: opcional, solo para el widget de subida del formulario de productos (lado cliente)
- `DB_QUERY_TIMEOUT_MS`: timeout de queries Prisma con fallback de 8000ms
- `DEMO_FALLBACK_ENABLED`: habilita fallback demo (`true/false`)
- `ADMIN_BASIC_USER` y `ADMIN_BASIC_PASSWORD`: acceso de emergencia para rutas `/admin`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: admin inicial que crea `prisma/seed-admin.ts`

## Acceso al admin

El login en `/admin/login` usa correo y contrasena (Better Auth). El administrador inicial lo
crea el script `prisma/seed-admin.ts` con estas credenciales por defecto (cambialas con las
variables de entorno correspondientes):

- correo: `admin@colibri.com`
- password: `admin1234`

Si olvidas la contrasena, la pantalla ofrece un "acceso de emergencia" que valida contra
`ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD` definidas en el servidor.

## Nota de produccion (Vercel)

Si en produccion ves errores 500 al crear/listar ordenes, revisa primero variables:
1. `DATABASE_URL` y `DATABASE_URL_UNPOOLED` cargadas en entorno `Production`.
2. Re-deploy despues de editar variables.
3. Verificar conectividad de la base PostgreSQL/Neon (host, credenciales, SSL).
4. Confirmar que `prisma generate` corre en el build (ya incluido en el script `build`).

## Estructura base

```text
colibri/
├── app/
├── actions/
├── components/
├── prisma/
├── public/
└── src/
```
