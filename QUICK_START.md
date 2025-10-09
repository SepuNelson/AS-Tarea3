# 🚀 Guía de Inicio Rápido - RabbitMQ Implementation

## ⚡ Pasos para ejecutar

### 1️⃣ Verificar requisitos previos

```powershell
# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version
```

### 2️⃣ Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
GEMINI_API_KEY=tu_api_key_de_gemini_aqui
```

> 💡 **Tip**: Obtén tu API key en https://aistudio.google.com/app/apikey

### 3️⃣ Levantar los servicios

```powershell
# Construir e iniciar todos los servicios
docker-compose up --build
```

Verás algo como:
```
✔ Container rabbitmq         Started
✔ Container quiz_service     Started  
✔ Container chatbot_service  Started
```

### 4️⃣ Verificar que todo funciona

Abre una nueva terminal PowerShell y ejecuta:

```powershell
# Probar Quiz Service
Invoke-RestMethod -Uri http://localhost:8000/questions

# Verificar Chatbot Service
Invoke-RestMethod -Uri http://localhost:8001/health
```

### 5️⃣ Ver los mensajes siendo procesados

```powershell
# Ver logs en tiempo real del chatbot
docker logs -f chatbot_service
```

Deberías ver:
```
INFO: Consumidor iniciado. Esperando mensajes en la cola 'quiz_questions'...
INFO: Mensaje recibido de la cola: [pregunta]
INFO: Respuesta generada por Gemini:
[respuesta de Gemini]
```

## 🎯 Comandos Útiles

### Enviar múltiples preguntas

```powershell
# Enviar 5 preguntas
1..5 | ForEach-Object {
    Invoke-RestMethod -Uri http://localhost:8000/questions
    Start-Sleep -Seconds 1
}
```

### Ver estado de RabbitMQ

```powershell
# Abrir el navegador en la UI de RabbitMQ
Start-Process http://localhost:15672
```

**Credenciales:**
- Usuario: `guest`
- Password: `guest`

### Ver logs de todos los servicios

```powershell
# Quiz Service
docker logs quiz_service

# Chatbot Service
docker logs chatbot_service

# RabbitMQ
docker logs rabbitmq
```

### Reiniciar todo

```powershell
# Detener servicios
docker-compose down

# Limpiar volúmenes (opcional)
docker-compose down -v

# Reiniciar
docker-compose up --build
```

## 🧪 Script de Prueba Automático

Ejecuta el script de prueba incluido:

```powershell
.\test_rabbitmq.ps1
```

Este script:
1. ✅ Verifica que los servicios estén corriendo
2. 📨 Envía 3 preguntas a la cola
3. ⏳ Espera 5 segundos
4. 📋 Muestra los logs del chatbot con las respuestas

## 🎨 Acceder a Interfaces Web

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Quiz Service API** | http://localhost:8000/docs | Swagger UI para quiz_service |
| **Chatbot Service API** | http://localhost:8001/docs | Swagger UI para chatbot_service |
| **RabbitMQ Management** | http://localhost:15672 | Panel de administración |

## 📊 Monitorear la Cola

1. Abre http://localhost:15672
2. Login con `guest` / `guest`
3. Ve a la pestaña **"Queues"**
4. Busca la cola **`quiz_questions`**
5. Verás:
   - 📨 Messages: Mensajes en la cola
   - 📈 Message rate: Velocidad de procesamiento
   - ✅ Deliveries: Mensajes entregados

## 🔍 Troubleshooting Rápido

### ❌ Error: "Cannot connect to RabbitMQ"

```powershell
# Verificar que RabbitMQ está corriendo
docker ps | Select-String rabbitmq

# Ver logs de RabbitMQ
docker logs rabbitmq
```

**Solución**: Espera unos segundos más, RabbitMQ puede tardar en iniciar.

### ❌ Error: "Gemini API Error"

Verifica que tu API key esté correctamente configurada en `.env`:

```powershell
# Ver variables de entorno del contenedor
docker exec chatbot_service printenv | Select-String GEMINI
```

### ❌ Los mensajes no se procesan

```powershell
# Verificar que el consumidor esté activo
docker logs chatbot_service | Select-String "Consumidor iniciado"

# Ver cola en RabbitMQ UI
Start-Process http://localhost:15672
```

## 📚 Siguiente Paso

Lee la documentación completa en:
- [RABBITMQ_IMPLEMENTATION.md](RABBITMQ_IMPLEMENTATION.md) - Documentación técnica detallada
- [README.md](README.md) - Documentación general del proyecto

## 🛑 Detener los Servicios

```powershell
# En la terminal donde corre docker-compose, presiona:
Ctrl + C

# O en otra terminal:
docker-compose down
```

---

**¡Listo! 🎉** Ahora tienes un sistema de microservicios con RabbitMQ funcionando.
