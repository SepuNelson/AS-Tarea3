# 📝 AS - Tarea 3

## 👥 Integrantes
| Nombre              | Rol      |
|---------------------|----------------|
| Ignacio Álvarez     | 202073582-4    |
| Francisco Domínguez | 202104520-1    |
| Nelson Sepúlveda    | 202004610-7    |

---

## 🏗️ Arquitectura con RabbitMQ

Este proyecto implementa una arquitectura de microservicios con **RabbitMQ** como sistema de mensajería:

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│                 │       │                 │       │                  │
│  Quiz Service   │──────▶│    RabbitMQ     │──────▶│ Chatbot Service  │
│   (Productor)   │       │ Message Broker  │       │   (Consumidor)   │
│   Puerto 8000   │       │                 │       │   Puerto 8001    │
│                 │       │  Puerto 5672    │       │                  │
└─────────────────┘       │  UI: 15672      │       └──────────────────┘
                          └─────────────────┘                │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │   Gemini API     │
                                                     └──────────────────┘
```

### Flujo de Mensajes:
1. **Quiz Service** genera preguntas aleatorias y las publica en la cola de RabbitMQ
2. **RabbitMQ** gestiona la cola de mensajes (`quiz_questions`)
3. **Chatbot Service** consume los mensajes y procesa las preguntas con Gemini AI
4. Las respuestas se registran en los logs del servicio

📚 **[Ver documentación completa de implementación](RABBITMQ_IMPLEMENTATION.md)**

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- API Key de Gemini (configurar en archivo `.env`)

### Configuración

1. Crear archivo `.env` en la raíz del proyecto:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

2. Construir y levantar los servicios:
```bash
docker-compose up --build
```

3. Verificar que los servicios estén corriendo:
```bash
# Quiz Service
curl http://localhost:8000/questions

# Chatbot Service Health
curl http://localhost:8001/health
```

4. Ver los logs del chatbot procesando preguntas:
```bash
docker logs -f chatbot_service
```

---

## 🔌 Servicios y Puertos

| Servicio          | Puerto | Descripción                                    |
|-------------------|--------|------------------------------------------------|
| Quiz Service      | 8000   | Genera y publica preguntas en RabbitMQ        |
| Chatbot Service   | 8001   | Consume preguntas y las procesa con Gemini    |
| RabbitMQ          | 5672   | Puerto AMQP para mensajería                    |
| RabbitMQ UI       | 15672  | Interfaz web de administración                 |

---

## 📖 Documentación API

### Quiz Service
🔗 **[http://localhost:8000/docs](http://localhost:8000/docs)**

**Endpoint Principal:**
- `GET /questions` - Genera y publica una pregunta en la cola

### Chatbot Service
🔗 **[http://localhost:8001/docs](http://localhost:8001/docs)**

**Endpoints:**
- `GET /health` - Verifica el estado del servicio
- `POST /chat` - Endpoint directo para chatear (legacy, no usa RabbitMQ)

### RabbitMQ Management
🔗 **[http://localhost:15672](http://localhost:15672)**
- Usuario: `guest`
- Contraseña: `guest`

---

## 🧪 Testing

### Prueba Automática (Windows)
```powershell
.\test_rabbitmq.ps1
```

### Prueba Manual
```bash
# Enviar preguntas
curl http://localhost:8000/questions

# Ver procesamiento en tiempo real
docker logs -f chatbot_service
```

---

## 📊 Monitoreo

### Ver logs de servicios individuales
```bash
docker logs quiz_service
docker logs chatbot_service
docker logs rabbitmq
```

### Ver logs en tiempo real
```bash
docker logs -f chatbot_service
```

### Verificar estado de la cola
- Acceder a http://localhost:15672
- Ir a "Queues" y buscar `quiz_questions`
- Ver mensajes en tránsito, rate, etc.

---

## 🛠️ Desarrollo

### Estructura del Proyecto
```
AS-Tarea3/
├── docker-compose.yml           # Configuración de servicios
├── services/
│   ├── quiz_service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt     # Incluye pika para RabbitMQ
│   │   └── app/
│   │       └── main.py          # Productor de mensajes
│   └── chatbot_service/
│       ├── Dockerfile
│       ├── requirements.txt     # Incluye pika para RabbitMQ
│       └── app/
│           └── main.py          # Consumidor + Gemini API
├── test_rabbitmq.ps1           # Script de prueba (Windows)
├── test_rabbitmq.sh            # Script de prueba (Linux/Mac)
└── RABBITMQ_IMPLEMENTATION.md  # Documentación técnica
```

### Tecnologías Utilizadas
- **FastAPI**: Framework web para ambos servicios
- **RabbitMQ**: Message broker para comunicación asíncrona
- **Pika**: Cliente Python para RabbitMQ
- **Google Gemini AI**: Procesamiento de lenguaje natural
- **Docker & Docker Compose**: Containerización y orquestación

---

## 🔧 Troubleshooting

### Servicios no se conectan a RabbitMQ
```bash
# Verificar que RabbitMQ esté corriendo
docker ps | grep rabbitmq

# Ver logs de RabbitMQ
docker logs rabbitmq

# Verificar healthcheck
docker inspect rabbitmq | grep Health
```

### No se procesan mensajes
```bash
# Ver logs del consumidor
docker logs chatbot_service | grep "Consumidor iniciado"

# Verificar cola en RabbitMQ UI
# http://localhost:15672 → Queues → quiz_questions
```

### Reiniciar servicios
```bash
docker-compose down
docker-compose up --build
```

---

## 📝 Notas Importantes

- ✅ Los mensajes son **persistentes** (sobreviven a reinicios)
- ✅ La cola es **durable** (se mantiene después de reiniciar RabbitMQ)
- ✅ Reintentos automáticos en caso de fallo de conexión
- ✅ Sistema de **ACK/NACK** para garantizar procesamiento
- ✅ QoS configurado para procesar un mensaje a la vez

---

## 📚 Documentación Adicional

- [Implementación Técnica de RabbitMQ](RABBITMQ_IMPLEMENTATION.md)
- [Documentación de RabbitMQ](https://www.rabbitmq.com/documentation.html)
- [Documentación de Pika](https://pika.readthedocs.io/)
- [Documentación de FastAPI](https://fastapi.tiangolo.com/)

---

## 🐳 Ejecución con Docker Compose
Para construir y levantar los servicios:

```bash
docker-compose up --build
```

Para detener los servicios:

```bash
docker-compose down
```
