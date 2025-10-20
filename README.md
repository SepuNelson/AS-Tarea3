# 📝 AS - Tarea 3 - Arquitectura con RabbitMQ y DLX

## 👥 Integrantes
| Nombre              | Rol      |
|---------------------|----------------|
| Ignacio Álvarez     | 202073582-4    |
| Francisco Domínguez | 202104520-1    |
| Nelson Sepúlveda    | 202004610-7    |

---

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura de microservicios utilizando **RabbitMQ** como message broker, con un enfoque en el manejo de errores a través de **Dead Letter Exchanges (DLX)** y una configuración declarativa.

Diagrama General   
<img width="920" height="418" alt="Diagrama de Arquitectura" src="https://github.com/user-attachments/assets/1bf85f44-8e11-4d72-805b-a61eefe631aa" />


Diagrama Chatbot Programación   
<img width="502" height="432" alt="Diagrama Microservicio drawio" src="https://github.com/user-attachments/assets/ac25a5f2-aba7-4136-bb2f-bc1b4ce6be66" />

### Flujo de Mensajes Detallado:
1.  **Producción:** `Quiz Service` (servicio auxiliar) genera una pregunta con un ID único y la publica en la cola `quiz_questions`.
2.  **Consumo:** `Chatbot Service` consume un mensaje a la vez de `quiz_questions`.
3.  **Procesamiento Exitoso:**
    *   El mensaje se procesa con la API de Gemini.
    *   La respuesta de Gemini se publica en una nueva cola: `gemini_responses`.
    *   El mensaje original de `quiz_questions` es confirmado (`ACK`), eliminándolo de la cola.
4.  **Manejo de Fallos (Lógica de Reintentos):**
    *   Si el procesamiento falla (ej. error de API, respuesta vacía), el servicio re-publica el mensaje en `quiz_questions` con un contador de reintentos.
    *   Se realiza un máximo de **3 reintentos**.
5.  **Dead Letter Exchange (DLX):**
    *   Si el mensaje falla después de todos los reintentos, se rechaza (`NACK`) y RabbitMQ lo redirige automáticamente a `dlx_exchange`.
    *   El exchange lo enruta a la cola `failed_questions_queue` para su inspección y manejo manual.

---


## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados.
- API Key de Gemini (configurar en archivo `.env`).

### Configuración

1.  Crear un archivo `.env` en la raíz del proyecto con tu API key:
    ```env
    GEMINI_API_KEY=tu_api_key_aqui
    ```

2.  Construir y levantar los servicios. La configuración de RabbitMQ se cargará automáticamente.
    ```bash
    docker-compose up --build
    ```

3.  Verificar que los servicios estén corriendo:
    ```bash
    # Publicar una pregunta para iniciar el flujo
    curl http://localhost:8000/questions

    # Verificar el estado del Chatbot Service
    curl http://localhost:8001/health
    ```

## 🔌 Servicios y Puertos

| Servicio          | Puerto | Descripción                                    |
|-------------------|--------|------------------------------------------------|
| Quiz Service      | 8000   | Genera y publica preguntas en RabbitMQ.        |
| Chatbot Service   | 8001   | Consume preguntas y las procesa con Gemini.    |
| RabbitMQ          | 5672   | Puerto AMQP para mensajería.                   |
| RabbitMQ UI       | 15672  | Interfaz web de administración.                |

---

## 📖 Documentación y Monitoreo

### Endpoints de API
-   **Quiz Service Docs:** 🔗 **[http://localhost:8000/docs](http://localhost:8000/docs)**
    -   `GET /questions`: Genera y publica una pregunta.
-   **Chatbot Service Docs:** 🔗 **[http://localhost:8001/docs](http://localhost:8001/docs)**
    -   `GET /health`: Verifica el estado del servicio.

### Monitoreo con RabbitMQ Management UI
La interfaz web es clave para observar el comportamiento del sistema.

🔗 **[http://localhost:15672](http://localhost:15672)**
-   **Usuario:** `guest`
-   **Contraseña:** `guest`
