# Implementación de RabbitMQ en Microservicios

## 📋 Descripción

Esta implementación utiliza **RabbitMQ** como sistema de mensajería para comunicar dos microservicios:

- **quiz_service** (Productor): Genera preguntas aleatorias y las publica en una cola de RabbitMQ
- **chatbot_service** (Consumidor): Consume las preguntas de la cola y las procesa usando la API de Gemini

## 🏗️ Arquitectura

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│                 │         │                 │         │                  │
│  quiz_service   │────────▶│    RabbitMQ     │────────▶│ chatbot_service  │
│   (Productor)   │         │  (Message Broker)         │   (Consumidor)   │
│                 │         │                 │         │                  │
└─────────────────┘         └─────────────────┘         └──────────────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │   Gemini API     │
                                                         │                  │
                                                         └──────────────────┘
```

## 🔧 Componentes Implementados

### 1. RabbitMQ Container

Se agregó un contenedor de RabbitMQ con la imagen oficial `rabbitmq:3-management` que incluye:
- Puerto **5672**: Protocolo AMQP para comunicación de mensajes
- Puerto **15672**: Interfaz web de administración
- Healthcheck para asegurar disponibilidad antes de iniciar servicios

### 2. Quiz Service (Productor)

**Cambios realizados:**
- Se agregó la biblioteca `pika` para comunicación con RabbitMQ
- Implementación de la función `get_rabbitmq_connection()` con reintentos automáticos
- Implementación de la función `publish_question()` para publicar mensajes en la cola
- El endpoint `/questions` ahora publica preguntas en la cola en lugar de retornarlas directamente
- Los mensajes se marcan como persistentes (`delivery_mode=2`)

**Flujo:**
1. Usuario hace GET a `/questions`
2. Se selecciona una pregunta aleatoria
3. La pregunta se publica en la cola `quiz_questions`
4. Se retorna confirmación al usuario

### 3. Chatbot Service (Consumidor)

**Cambios realizados:**
- Se agregó la biblioteca `pika` para comunicación con RabbitMQ
- Implementación de `start_consumer()` que inicia un consumidor en un hilo separado
- Implementación del callback `callback()` que procesa cada mensaje
- Función `process_question_with_gemini()` que envía la pregunta a Gemini API
- El consumidor se inicia automáticamente al arrancar la aplicación (`startup_event`)
- Configuración de QoS para procesar un mensaje a la vez
- Sistema de ACK/NACK para confirmar o rechazar mensajes

**Flujo:**
1. El consumidor escucha continuamente la cola `quiz_questions`
2. Cuando llega un mensaje, se extrae la pregunta
3. La pregunta se envía a Gemini API con el prompt configurado
4. La respuesta se registra en los logs
5. Se confirma el mensaje (ACK) o se rechaza (NACK) en caso de error

## 🚀 Cómo Usar

### 1. Iniciar los Servicios

```bash
docker-compose up --build
```

Este comando:
- Construye las imágenes de los servicios
- Inicia RabbitMQ
- Espera a que RabbitMQ esté saludable
- Inicia quiz_service y chatbot_service

### 2. Verificar que los Servicios Están Corriendo

```bash
# Verificar quiz_service
curl http://localhost:8000/health

# Verificar chatbot_service
curl http://localhost:8001/health
```

### 3. Enviar una Pregunta

```bash
curl http://localhost:8000/questions
```

**Respuesta esperada:**
```json
{
  "message": "Pregunta enviada al servicio de chatbot para procesamiento",
  "question": "Revisa si este código es correcto y corrígelo: print('Hola Mundo\");"
}
```

### 4. Ver los Logs del Chatbot

Para ver cómo el chatbot procesa las preguntas:

```bash
docker logs -f chatbot_service
```

Verás algo como:
```
INFO: Mensaje recibido de la cola: Revisa si este código es correcto y corrígelo: print('Hola Mundo");
INFO: Respuesta generada por Gemini:
El código tiene un error de sintaxis. Falta la comilla de cierre en la cadena de texto...
```

### 5. Acceder a la Interfaz de RabbitMQ

Abre tu navegador en: http://localhost:15672

- **Usuario**: guest
- **Contraseña**: guest

Aquí puedes:
- Ver la cola `quiz_questions`
- Monitorear mensajes en tránsito
- Ver estadísticas de producción/consumo

## 🔍 Endpoints Disponibles

### Quiz Service (Puerto 8000)

| Método | Endpoint      | Descripción                                    |
|--------|---------------|------------------------------------------------|
| GET    | `/questions`  | Genera y publica una pregunta en la cola      |

### Chatbot Service (Puerto 8001)

| Método | Endpoint | Descripción                                        |
|--------|----------|----------------------------------------------------|
| GET    | `/health`| Verifica el estado del servicio                    |
| POST   | `/chat`  | Endpoint directo para chatear con Gemini (legacy)  |

## 📊 Variables de Entorno

Ambos servicios utilizan las siguientes variables para conectarse a RabbitMQ:

```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

El chatbot_service también requiere:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

## 🔒 Características de Robustez

1. **Reintentos Automáticos**: Ambos servicios reintentan conectarse a RabbitMQ hasta 5 veces
2. **Mensajes Persistentes**: Los mensajes sobreviven a reinicios de RabbitMQ
3. **Cola Durable**: La cola `quiz_questions` persiste después de reinicios
4. **ACK Manual**: Los mensajes solo se eliminan después de procesamiento exitoso
5. **NACK con Requeue**: Los mensajes fallidos se reintroducen en la cola
6. **QoS**: Se procesa un mensaje a la vez para evitar sobrecarga
7. **Healthcheck**: RabbitMQ debe estar saludable antes de iniciar servicios

## 🧪 Prueba Completa del Flujo

```bash
# 1. Iniciar servicios
docker-compose up --build -d

# 2. Esperar unos segundos para que todo inicie
sleep 10

# 3. Enviar múltiples preguntas
for i in {1..5}; do
    curl http://localhost:8000/questions
    echo ""
done

# 4. Ver los logs del chatbot procesando
docker logs chatbot_service

# 5. Ver estadísticas en RabbitMQ
# Abrir http://localhost:15672 en el navegador
```

## 📝 Notas Importantes

- El consumidor corre en un hilo daemon separado para no bloquear FastAPI
- Los logs son fundamentales para ver las respuestas de Gemini
- Si el chatbot falla al procesar, el mensaje se reintenta automáticamente
- La interfaz de RabbitMQ es útil para debugging y monitoreo

## 🛠️ Troubleshooting

### Los servicios no se conectan a RabbitMQ
- Verifica que RabbitMQ esté corriendo: `docker ps | grep rabbitmq`
- Revisa los logs de RabbitMQ: `docker logs rabbitmq`
- Verifica el healthcheck: `docker inspect rabbitmq | grep Health`

### No se procesan mensajes
- Verifica que el consumidor esté corriendo: `docker logs chatbot_service | grep "Consumidor iniciado"`
- Revisa la cola en RabbitMQ Management UI
- Verifica que GEMINI_API_KEY esté configurada correctamente

### Mensajes se pierden
- Los mensajes son persistentes y la cola es durable
- Verifica que no haya errores en los logs
- Revisa el estado de ACK/NACK en RabbitMQ Management UI
