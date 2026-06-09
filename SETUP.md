# 🏨 Hoteles Boutique — Guía de Setup Local

Guía paso a paso para levantar el proyecto en tu máquina desde cero.

---

## Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Docker Desktop** | Cualquier versión reciente | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Node.js** | v20+ | [nodejs.org](https://nodejs.org/) |
| **Bun** *(opcional, recomendado)* | v1.x | [bun.sh](https://bun.sh/) |
| **Git** | Cualquier versión | [git-scm.com](https://git-scm.com/) |

> ⚠️ **Docker Desktop debe estar corriendo** antes de ejecutar cualquier comando de docker.

---

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd s136-p09-hoteles-boutique-main
```

---

## 2. Configurar variables de entorno

El archivo `.env` **no está en el repositorio** por seguridad (contiene claves secretas). Debes pedirle el archivo `.env` a un compañero que ya tenga el proyecto funcionando.

Una vez que tengas el archivo, colócalo en la **raíz del proyecto** (junto a `package.json`).

```
s136-p09-hoteles-boutique-main/
├── .env          ← aquí va el archivo
├── package.json
├── docker-compose.yml
└── ...
```

---

## 3. Instalar dependencias

```bash
npm install
```

O si tienes Bun:

```bash
bun install
```

---

## 4. Levantar la base de datos con Docker

El proyecto necesita **PostgreSQL** y **Redis** corriendo. El `docker-compose.yml` ya los tiene configurados.

```bash
# Solo levanta la DB y Redis (modo desarrollo, NO el contenedor de la app)
docker compose up postgres redis -d
```

Verifica que estén corriendo:

```bash
docker compose ps
```

Deberías ver `bh_postgres` y `bh_redis` con estado `running`.

---

## 5. Correr migraciones y cargar datos iniciales

Este comando crea todas las tablas en la base de datos Y carga los hoteles, habitaciones y servicios de ejemplo:

```bash
npm run db:setup
```

> Esto equivale a `npm run db:migrate && npm run db:seed`. Solo necesitas hacerlo **una vez** (o si reseteas la base de datos).

---

## 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Credenciales de prueba

Una vez que el seed esté cargado, puedes iniciar sesión con:

| Rol | Email | Contraseña |
|---|---|---|
| **Super Admin** | `admin@boutique.cl` | `Admin1234!` |
| **Hotel Admin** | `manager@boutique.cl` | `Manager1234!` |
| **Huésped** | `guest@boutique.cl` | `Guest1234!` |

> Puedes crear tu propia cuenta desde `/es/auth/register`.

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run build        # Build de producción
npm run db:migrate   # Aplica migraciones pendientes
npm run db:seed      # Carga datos de ejemplo
npm run db:setup     # migrate + seed juntos
npm run db:studio    # Abre Drizzle Studio (UI para la base de datos)
```

---

## Apagar el entorno

```bash
# Detener los contenedores (conserva los datos)
docker compose down

# Detener Y borrar todos los datos (reset completo)
docker compose down -v
```

Si haces reset completo, tendrás que volver a correr `npm run db:setup`.

---

## Solución de problemas frecuentes

### ❌ Error: `connect ECONNREFUSED 127.0.0.1:5433`
La base de datos no está corriendo. Ejecuta:
```bash
docker compose up postgres redis -d
```

### ❌ Error: `Cannot find module` o similar al instalar
Borra la carpeta `node_modules` e instala de nuevo:
```bash
rm -rf node_modules
npm install
```

### ❌ El seed falla con "already exists"
La base de datos ya tiene datos. No es un error grave. Si quieres hacer un reset limpio:
```bash
docker compose down -v
docker compose up postgres redis -d
npm run db:setup
```

### ❌ Error de variable de entorno faltante
Verifica que el archivo `.env` esté en la raíz del proyecto y que contenga todas las variables necesarias. Pídele el archivo a un compañero.

---

## Arquitectura del proyecto

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/     # Páginas públicas (hoteles, reviews, auth)
│   │   ├── (guest)/      # Páginas del huésped (reservas, perfil)
│   │   └── admin/        # Panel de administración
│   └── api/              # API Routes (REST)
├── components/           # Componentes React reutilizables
├── db/                   # Schema de Drizzle ORM + seed
├── lib/                  # Auth, helpers, utilidades
├── services/             # Lógica de negocio (hotel, booking, review...)
└── types/                # Tipos TypeScript compartidos
```

**Stack:** Next.js 15 · TypeScript · PostgreSQL · Drizzle ORM · Redis · NextAuth v5 · TailwindCSS v4
