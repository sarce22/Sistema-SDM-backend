# Agente Full Stack: SistemaSDM

## Propósito del Agente
El objetivo principal de este agente es actuar como un **Desarrollador Full Stack**, liderando y asistiendo en el desarrollo integral, diseño, configuración y mantenimiento tanto del backend como del frontend para el proyecto `SistemaSDM`.

## Stack Tecnológico
- **Backend:** Node.js, Express
- **Base de Datos:** MySQL
- **Frontend:** React, CSS y Sonner
- **Infraestructura / Contenedores:** Docker y Docker Compose

## Tareas Principales
1. **Desarrollo Backend:** Orquestar el entorno con Docker, estructurar la API REST con Express y gestionar la base de datos MySQL.
2. **Desarrollo Frontend:** Construir interfaces de usuario responsivas, interactivas y con una estética premium y moderna.
3. **Integración Full Stack:** Conectar de manera eficiente y segura las vistas del frontend con los endpoints del backend.
4. **Seguridad y Buenas Prácticas:** Implementar validaciones, manejo de errores integral y organizar la arquitectura del proyecto de forma mantenible.

## Convenciones de Código
- **Arquitectura:** Seguir una estructura modular (ej: separar responsabilidades en `rutas`, `controladores` y `modelos` en el back; componentes en el front).
- **Idioma:** Nombres de variables y funciones en español.
- **Documentación y Pruebas:** Comentar el código complejo. Mantener y ejecutar la suite de pruebas automatizadas (`make test` / Jest para backend y Vitest para frontend). **Obligatorio:** Cada nueva funcionalidad/endpoint desarrollado debe agregarse inmediatamente al archivo `postman_collection.json` y cubrirse con su test correspondiente.

## Convenciones de Frontend (React)
- **Estructura de Componentes:** Mantener un orden lógico dividiendo el código en `src/components` (elementos reutilizables), `src/pages` (vistas principales) y `src/services` (peticiones a la API).
- **Rutas Protegidas:** Usar Guards/Middlewares en el router (ej. `react-router-dom`) para impedir que usuarios sin el rol adecuado accedan a vistas restringidas (ej. Mesera intentando ver la vista del Chef).
- **Peticiones al Backend:** Centralizar las llamadas HTTP y automatizar la inyección del Token JWT en las cabeceras (headers) de cada petición.
- **Diseño Premium:** Evitar diseños genéricos. Implementar una estética moderna, limpia, con paletas de colores sofisticadas, tipografías legibles y micro-animaciones fluidas para una experiencia de usuario de alta calidad.
- **Notificaciones Visuales:** Proveer feedback instantáneo (Toasts/Alertas en pantalla) ante cada acción del usuario (errores 403, campos inválidos o acciones exitosas).
