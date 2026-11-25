# Gestión Académica — SPA en Angular con JWT

Aplicación web de una sola página (SPA) para gestionar **cursos** y **usuarios** de una institución educativa, con inicio de sesión mediante **JWT**, **rutas protegidas por guards** y **paneles distintos según el rol** (administrador, profesor, estudiante).

Trabajo final de la unidad didáctica **Desarrollo de Interfaces 3** — IDAT, Escuela de Tecnología.

- **Estudiante:** Anderson Ugaz
- **Docente:** José Manuel Inga Nerio

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 20 (arquitectura con **NgModules**), TypeScript, RxJS |
| Diseño | Bootstrap 5 y Bootstrap Icons |
| API REST | Node.js puro (`api/server.js`), sin dependencias externas |
| Seguridad | JWT firmado con HS256, expiración configurable, contraseñas con hash SHA-256 y sal |

## Requisitos

- **Node.js 20.19 o superior** (recomendado: la versión LTS 22 o 24): <https://nodejs.org>
- **npm** (viene con Node.js)
- Git (para clonar el repositorio)

Comprueba las versiones:

```bash
node -v
npm -v
```

## Instalación

```bash
git clone https://github.com/andersonugazpor-crypto/gestion-academica-angular.git
cd gestion-academica-angular
npm install
```

## Ejecución

Opción 1: un solo comando (levanta la API y Angular juntos):

```bash
npm run dev
```

Opción 2: en dos terminales separadas:

```bash
# Terminal 1: API REST en http://localhost:3000/api
npm run api

# Terminal 2: Angular en http://localhost:4200
npm start
```

Abre <http://localhost:4200> en el navegador.

### Cuentas de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@idat.edu.pe` | `admin123` |
| Profesor | `profesor@idat.edu.pe` | `profe123` |
| Estudiante | `estudiante@idat.edu.pe` | `estu123` |

En la pantalla de login hay botones para rellenar cada cuenta con un clic.

### Otros comandos

| Comando | Qué hace |
|---------|----------|
| `npm run api:reset` | Restaura los datos iniciales de la API y la inicia |
| `npm run test:api` | Ejecuta las 25 pruebas funcionales de la API |
| `npm run build` | Genera la versión de producción en `dist/` |
| `TOKEN_EXP=60 npm run api` | Inicia la API con tokens de 60 segundos (para probar la expiración). En PowerShell: `$env:TOKEN_EXP=60; npm run api` |

## Funcionalidades

- **Login con JWT**: la API devuelve un token firmado; Angular lo guarda en `localStorage` y lo envía en cada petición.
- **Cierre de sesión automático** cuando el token expira.
- **Guards**: `authGuard`, `authChildGuard`, `roleGuard`, `loginGuard` y `cambiosPendientesGuard`.
- **Carga dinámica por rol**: el dashboard crea un panel distinto para admin, profesor o estudiante con `*ngComponentOutlet`.
- **CRUD de cursos** (admin y profesor) e **inscripción** a cursos (estudiante).
- **CRUD de usuarios** (solo admin).
- **Interceptores HTTP**: token automático, manejo global de errores (401, 403, 0, 5xx) y barra de carga.
- **Pipes propios**: `rol`, `iniciales`, `creditos`, `filtroTexto`.
- **Directivas propias**: `*appTieneRol` (estructural), `appResaltar` y `appAutofocus` (de atributo).
- **Página 404** para rutas inexistentes y página de **acceso denegado**.

## Permisos por rol

| Acción | Admin | Profesor | Estudiante |
|--------|:-----:|:--------:|:----------:|
| Ver dashboard | ✔ | ✔ | ✔ |
| Ver cursos | Todos | Todos | Solo activos |
| Crear curso | ✔ | ✔ (a su nombre) | — |
| Editar curso | ✔ | Solo los suyos | — |
| Eliminar curso | ✔ | — | — |
| Inscribirse en curso | — | — | ✔ |
| Gestionar usuarios | ✔ | — | — |

## Estructura del proyecto

```
gestion-academica-angular/
├── api/
│   ├── server.js            API REST con JWT (Node.js puro)
│   ├── db.seed.json         Datos iniciales
│   └── pruebas-api.js       Pruebas funcionales de la API
├── src/app/
│   ├── core/                Singleton: modelos, servicios, guards e interceptores
│   │   ├── models/
│   │   ├── services/        AuthService, TokenService, BaseCrudService, CursoService, UsuarioService...
│   │   ├── guards/          authGuard, roleGuard, loginGuard, cambiosPendientesGuard
│   │   ├── interceptors/    AuthInterceptor, ErrorInterceptor, LoadingInterceptor
│   │   └── core.module.ts
│   ├── shared/              Pipes, directivas y componentes reutilizables (SharedModule)
│   ├── layout/              Layout privado con menú por rol
│   ├── features/
│   │   ├── auth/            Módulo lazy: login
│   │   ├── dashboard/       Módulo lazy: paneles por rol
│   │   ├── cursos/          Módulo lazy: listado, detalle, formulario
│   │   ├── usuarios/        Módulo lazy (solo admin): listado y formulario
│   │   └── errores/         404 y acceso denegado
│   ├── app-routing.module.ts
│   └── app.module.ts
└── src/environments/environment.ts   URL de la API
```

## Mapa de rutas

| Ruta | Módulo | Protección |
|------|--------|------------|
| `/login` | AuthModule (lazy) | `loginGuard` |
| `/dashboard` | DashboardModule (lazy) | `authGuard` |
| `/cursos` | CursosModule (lazy) | `authGuard` |
| `/cursos/nuevo` | CursosModule | `roleGuard` (admin, profesor) + `cambiosPendientesGuard` |
| `/cursos/:id` | CursosModule | `authGuard` |
| `/cursos/:id/editar` | CursosModule | `roleGuard` (admin, profesor) + `cambiosPendientesGuard` |
| `/usuarios` | UsuariosModule (lazy) | `roleGuard` con `canMatch` (solo admin) |
| `/usuarios/nuevo` | UsuariosModule | `cambiosPendientesGuard` |
| `/usuarios/:id/editar` | UsuariosModule | `cambiosPendientesGuard` |
| `/acceso-denegado` | — | `authGuard` |
| `/**` | — | Página 404 |

## Endpoints de la API

Base: `http://localhost:3000/api`. Todas las rutas (salvo el login) requieren `Authorization: Bearer <token>`.

| Método | Ruta | Roles |
|--------|------|-------|
| POST | `/auth/login` | Público |
| GET | `/auth/perfil` | Todos |
| GET | `/estadisticas` | Todos (la respuesta cambia según el rol) |
| GET | `/cursos?q=` | Todos |
| GET | `/cursos/:id` | Todos |
| POST | `/cursos` | admin, profesor |
| PUT | `/cursos/:id` | admin, profesor dueño |
| DELETE | `/cursos/:id` | admin |
| POST / DELETE | `/cursos/:id/inscripcion` | estudiante |
| GET | `/profesores` | admin, profesor |
| GET | `/usuarios?rol=` | admin |
| GET / PUT / DELETE | `/usuarios/:id` | admin |
| POST | `/usuarios` | admin |

Códigos de respuesta: `200`, `201`, `204`, `400` (validación, con `errores` por campo), `401` (sin token, token inválido o expirado), `403` (rol sin permiso), `404`, `409` (duplicado).

## Solución de problemas

- **"No se pudo conectar con la API"**: la API no está encendida. Ejecuta `npm run api` en otra terminal.
- **El puerto 4200 o 3000 está ocupado**: cierra la otra terminal que lo usa, o ejecuta `npx ng serve --port 4300`.
- **Quiero volver a los datos iniciales**: detén la API y ejecuta `npm run api:reset`.
