# Campus Chat Web

Aplicación web tipo WhatsApp enfocada a estudiantes que consume el API Gateway expuesto sobre los microservicios
descritos en `requerimientos.md`.

## Características

- Autenticación JWT (`/v1/auth/login`, `/v1/users/register`, `/v1/users/me`).
- Gestión de canales e hilos, con presencia y estados online/offline.
- Mensajería en tiempo (casi) real con soporte para archivos adjuntos.
- Moderación automática, panel auxiliar con strikes/baneos y alertas visuales.
- Búsqueda global (mensajes, archivos, canales) con atajo `Ctrl+K`.
- Integración de chatbots (`/chat-wikipedia`, `/chat`, endpoints académicos/utility/cálculo).
- Panel lateral con archivos compartidos y métricas de presencia.

## Requerimientos

- Node.js 18+
- Variables de entorno (`env.example`):
  - `VITE_API_URL`: URL del API Gateway (por ejemplo `https://api.campuschat.local`).
  - `VITE_REALTIME_URL`: endpoint WebSocket/SSE que fan-out los eventos (opcional, se infiere desde `VITE_API_URL`).

## Scripts

```bash
npm install
npm run dev      # entorno de desarrollo
npm run build    # compila a producción (dist/)
npm run preview  # sirve la build localmente
```

## Observabilidad y seguridad

- `src/lib/telemetry.ts` deja hook para enviar eventos a OpenTelemetry / Grafana.
- `apiClient` agrega encabezado `X-App-Client` y gestiona expiración de token.
- `sanitizeHtml` (DOMPurify) evita XSS al renderizar contenido/bots.
- Todos los requests usan `useQuery`/`useMutation` con manejo de errores centralizado accesible en UI (toasts o alertas simplificadas).
- `npm run build` se ejecuta en CI y publica el contenido de `dist/` en un hosting estático detrás del Gateway.

## Próximos pasos sugeridos

- Configurar despliegue automatizado (GitHub Actions/Azure DevOps) que ejecute `npm run build` y suba `dist/` al CDN.
- Instrumentar `logTelemetry` para enviar métricas reales (Datadog, Grafana Tempo, etc.).
- Conectar la capa de WebSocket/SSE del Gateway para actualizar canales/hilos/mensajes sin pooling.
- Añadir pruebas E2E (Playwright/Cypress) para los flujos críticos descritos en `docs/alcance-ux.md`.




