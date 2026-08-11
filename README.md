# Colibrí

Aplicacion full stack para una tienda de abarrotes construida con Next.js.

Produccion: https://tiendacolibri.vercel.app

La app tiene dos caras:
1. Cliente: navegar la jerarquia de categorias (Departamento -> Categoria -> Subcategoria), armar carrito y crear pedido.
2. Admin: gestionar categorias, productos y finanzas, y aprobar/completar ordenes (el inventario se descuenta al aprobar).

Tambien tiene modo demo (fallback) para mantener navegabilidad cuando la base de datos no responde.

## Stack

- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL (Neon)
- Better Auth (autenticacion)
- Tailwind CSS
- Zustand + SWR
- Zod
- Cloudinary (imagenes)
- Cloudflare Turnstile (anti-bots en el checkout)
- Upstash Redis (rate limiting)

## Funcionalidades

- Jerarquia de categorias en 3 niveles (Departamento, Categoria, Subcategoria con codigo).
- Importacion de categorias por CSV (upsert reejecutable).
- Catalogo por categorias con carrito lateral; los agotados se ocultan.
- Creacion de orden desde el cliente, protegida con Cloudflare Turnstile y rate limiting (Upstash).
- Panel admin para categorias, productos e inventario.
- Aprobacion de ordenes con descuento de stock.
- Modulo de finanzas: ingresos y egresos con filtros por periodo (dia/semana/mes/anio), registro manual de movimientos, y creacion automatica del ingreso al completar una orden (con soft-delete/restauracion si el movimiento esta ligado a una orden existente).
- Validacion de payloads con Zod.
- Sync entre vistas con SWR + eventos.
- Fallback demo configurable por entorno.

## Arquitectura (resumen)

- UI y rutas: App Router (`app/`)
- Autenticacion: Better Auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`)
- Proteccion de rutas `/admin`: `proxy.ts`
- Mutaciones de ordenes:
1. `POST /order/api`
2. `POST /admin/orders/api/complete` (crea automaticamente el `FinanceEntry` de ingreso)
3. `POST /admin/orders/api/delete` (desasocia el `FinanceEntry` sin eliminarlo)
- Lectura de ordenes:
1. `GET /admin/orders/api`
2. `GET /orders/api`
3. `GET /admin/completed/api`
- Finanzas: `app/admin/(protected)/finance/page.tsx` + `actions/create-finance-entry-action.ts`, `actions/delete-finance-entry-action.ts`, `actions/restore-finance-entry-action.ts`
- Prisma client compartido en `src/lib/prisma.ts`

## Requisitos previos (Ubuntu)

Herramientas necesarias en el sistema antes de instalar el proyecto:

- **Git** para clonar el repositorio
- **Node.js 20 LTS** (o superior, requerido por Next.js 16) y **npm**
- **Cliente `psql`** de PostgreSQL, solo si vas a ejecutar las queries SQL manualmente o conectarte a la base desde la terminal (no es obligatorio si usas `prisma db push`)
- Cuenta y proyecto en **Neon** (o cualquier PostgreSQL accesible por URL) para `DATABASE_URL` / `DATABASE_URL_UNPOOLED`
- Cuenta en **Cloudinary** para `CLOUDINARY_URL`
- Cuenta en **Cloudflare Turnstile** para `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Cuenta en **Upstash Redis** para `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

### 1. Actualizar el sistema e instalar dependencias base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git build-essential
```

### 2. Instalar Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

### 3. (Opcional) Instalar el cliente `psql` de PostgreSQL

Solo si quieres correr las queries SQL manualmente contra la base de datos:

```bash
sudo apt install -y postgresql-client
psql --version
```

## Instalacion local

### 1. Clonar repo

```bash
git clone https://github.com/helaenrose/colibri.git
cd colibri
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear `.env` (puedes copiar `.env.template`)

```bash
cp .env.template .env
```

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

# Cloudflare Turnstile (proteccion anti-bots en el formulario de pedidos publico)
# Obtenlas en https://dash.cloudflare.com/ -> Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Upstash Redis (rate limiting: max 15 pedidos por IP cada 15 minutos)
# Obtenlas en https://console.upstash.com/ -> tu base de datos -> REST API
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

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

### 4. Crear el esquema en la base de datos

Hay dos formas de aplicar el esquema (tablas, enums, indices y llaves foraneas). Usa la que prefieras, no ambas.

**Opcion A — Recomendada: Prisma sincroniza el esquema automaticamente**

```bash
npx prisma generate
npx prisma db push
```

**Opcion B — Ejecutar las queries SQL manualmente con `psql`**

El archivo `prisma/schema.sql` contiene el DDL completo (tablas, enums, indices y foreign keys) generado desde `prisma/schema.prisma`. Utilizalo si necesitas crear el esquema a mano, por ejemplo contra un Postgres nuevo sin pasar por Prisma:

```bash
psql "$DATABASE_URL_UNPOOLED" -f prisma/schema.sql
npx prisma generate
```

Contenido resumido de `prisma/schema.sql` (queries principales):

```sql
-- Enums
CREATE TYPE "CategoryLevel" AS ENUM ('DEPARTMENT', 'CATEGORY', 'SUBCATEGORY');
CREATE TYPE "DeliveryType" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "FinanceEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- Catalogo
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" "CategoryLevel" NOT NULL DEFAULT 'DEPARTMENT',
    "code" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "supplier" TEXT,
    "categoryId" TEXT,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Ordenes
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'PICKUP',
    "receiptUrl" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "orderReadyAt" TIMESTAMP(3),
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderProducts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "OrderProducts_pkey" PRIMARY KEY ("id")
);

-- Finanzas
CREATE TABLE "finance_entry" (
    "id" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,
    "orderCustomerName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finance_entry_pkey" PRIMARY KEY ("id")
);

-- Llaves foraneas relevantes
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderProducts" ADD CONSTRAINT "OrderProducts_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderProducts" ADD CONSTRAINT "OrderProducts_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_entry" ADD CONSTRAINT "finance_entry_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

> El esquema completo (incluye tambien las tablas de Better Auth: `user`, `session`, `account`, `verification`,
> y las de galeria de imagenes: `media_asset`, `product_image`, `category_image`, ademas de `business_profile`
> y `bank_account`) esta en `prisma/schema.sql`. Si el schema de Prisma cambia, regeneralo con:
>
> ```bash
> npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/schema.sql
> ```

### 5. Sembrar datos (categorias, productos y admin inicial)

```bash
npx tsx prisma/seed.ts
npx tsx prisma/seed-admin.ts
```

### 6. Levantar el proyecto

Modo desarrollo (hot reload):

```bash
npm run dev
```

O compilar y correr en modo produccion:

```bash
npm run build
npm run start
```

### 7. Abrir

```text
http://localhost:3000
```

## Scripts

- `npm run dev`: desarrollo
- `npm run build`: `prisma generate` + build de produccion
- `npm run start`: correr build
- `npm run lint`: lint con ESLint
- `npx prisma generate`: regenera el cliente de Prisma
- `npx prisma db push`: sincroniza el esquema de `schema.prisma` contra la base de datos
- `npx prisma studio`: explorador visual de la base de datos
- `npx tsx prisma/seed.ts`: siembra categorias y productos de ejemplo
- `npx tsx prisma/seed-admin.ts`: crea el usuario administrador inicial

## Herramientas y servicios externos requeridos

| Herramienta / servicio | Uso | Variables relacionadas |
| --- | --- | --- |
| Node.js 20+ / npm | Runtime y gestor de paquetes | - |
| PostgreSQL (Neon recomendado) | Base de datos principal (Prisma) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| Better Auth | Autenticacion de administradores | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| Cloudinary | Almacenamiento de imagenes y comprobantes | `CLOUDINARY_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| Cloudflare Turnstile | Anti-bots en el formulario publico de pedidos | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Upstash Redis | Rate limiting de creacion de pedidos | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| `psql` (opcional) | Ejecutar `prisma/schema.sql` manualmente | - |

## Variables de entorno importantes

- `DATABASE_URL`: conexion PostgreSQL/Neon con pooling (obligatoria)
- `DATABASE_URL_UNPOOLED`: conexion directa sin pooling, usada por Prisma para migraciones y por `psql` (obligatoria)
- `BETTER_AUTH_SECRET`: secreto para firmar sesiones (obligatoria)
- `BETTER_AUTH_URL`: URL base de auth (opcional, fallback a la URL de Vercel)
- `CLOUDINARY_URL`: credenciales de Cloudinary en una sola cadena `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (obligatoria para subir comprobantes/imagenes desde el servidor)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: opcional, solo para el widget de subida del formulario de productos (lado cliente)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: clave publica de Cloudflare Turnstile, se envia al navegador (obligatoria para el checkout publico)
- `TURNSTILE_SECRET_KEY`: clave secreta de Turnstile, validacion en el servidor (obligatoria para el checkout publico)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: credenciales REST de Upstash Redis para limitar pedidos por IP (obligatorias para el checkout publico)
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
│   ├── schema.prisma
│   ├── schema.sql
│   ├── seed.ts
│   └── seed-admin.ts
├── public/
└── src/
```
