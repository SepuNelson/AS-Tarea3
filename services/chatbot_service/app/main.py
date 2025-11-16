import logging
import os
import time
import json
import threading
from functools import lru_cache
import httpx
import uuid

from fastapi import FastAPI, HTTPException, status
from google import genai
from pydantic import BaseModel
import pika

# Configurar logging para que muestre mensajes INFO
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Chatbot Service",
    description="Wrapper de FastAPI para consumir el modelo Gemini con RabbitMQ y DLX",
    version="2.0.0",
)

PROMPT_TEMPLATE = """Actúa como un asistente experto en programación. Recibirás un mensaje de un usuario que puede contener una pregunta técnica, una solicitud de ejemplo de código, o una duda sobre un concepto de programación.

Tu tarea es analizar el mensaje y responder de la siguiente manera:

- Si la pregunta es sobre un **concepto**, proporciona una explicación clara y concisa. Usa analogías si son útiles para una mejor comprensión.
- Si la pregunta requiere un **ejemplo de código**, genera un snippet de código simple y funcional que ilustre el concepto o la solución solicitada. Asegúrate de que el código esté bien comentado para una fácil lectura.
- Si necesitas proporcionar **recursos adicionales**, incluye enlaces a documentación oficial o tutoriales de alta calidad.

**Variable:**
- `mensaje`: El mensaje del usuario.

**Ejemplo de uso:**
**Usuario:** "Hola, me podrías explicar qué es una API?"
**Tu respuesta esperada:** Una explicación clara sobre qué es una API, tal vez con una analogía.

**Usuario:** "Cómo hago un bucle for en Python?"
**Tu respuesta esperada:** Un snippet de código de un bucle for en Python con comentarios.

**Instrucciones para ti:**
1.  Identifica el tipo de consulta en el `mensaje`.
2.  Genera una respuesta precisa y útil, eligiendo entre una explicación, un snippet de código, o una combinación de ambos.
3.  Mantén el tono profesional y servicial.
4.  No incluyas explicaciones innecesarias; sé directo y al punto.

Mensaje del usuario:
{mensaje}
"""

# Configuración RabbitMQ
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

# colas
QUESTIONS_QUEUE = os.getenv("QUESTIONS_QUEUE", "quiz_questions")
RESPONSES_QUEUE = os.getenv("RESPONSES_QUEUE", "gemini_responses")
FAILED_QUESTIONS_QUEUE = os.getenv("FAILED_QUESTIONS_QUEUE", "failed_questions_queue")
FAILED_RESPONSES_QUEUE = os.getenv("FAILED_RESPONSES_QUEUE", "failed_responses_queue")

# Configuración DLX
DLX_EXCHANGE = os.getenv("DLX_EXCHANGE", "dlx_exchange")
MAX_RETRIES = 3

# Configuración del servicio de mensajes
MESSAGES_SERVICE_URL = os.getenv("MESSAGES_SERVICE_URL", "http://localhost:3000")
CHATBOT_USER_ID = os.getenv("CHATBOT_USER_ID", "00000000-0000-0000-0000-000000000000") # UUID para el bot


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@lru_cache(maxsize=1) #evita recrear el cliente en cada petición
def get_genai_client() -> genai.Client:
    """Create (and memoize) the Gemini client using the GEMINI_API_KEY env var."""

    try:
        return genai.Client()
    except Exception as exc:
        logger.exception("Failed to create Gemini client")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo inicializar el cliente de Gemini. Verifica la API key.",
        ) from exc


def build_prompt(message: str) -> str:
    """Construct the instruction prompt expected by Gemini."""

    return PROMPT_TEMPLATE.format(mensaje=message.strip())


def process_question_with_gemini(question: str) -> str:
    """Procesa una pregunta usando la API de Gemini"""
    try:
        prompt = build_prompt(question)
        response = get_genai_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        
        reply = (response.text or "").strip() if hasattr(response, "text") else ""
        if not reply:
            # Considerar una respuesta vacía como un error para que sea reintentado
            raise ValueError("El modelo no entregó contenido en la respuesta.")
        
        return reply
    except Exception as e:
        # Registrar el error y RE-LANZAR la excepción
        # Esto es crucial para que el callback active la lógica de reintentos/DLX
        logger.error(f"Error al procesar con Gemini: {e}")
        raise


def get_rabbitmq_connection():
    """Establece conexión con RabbitMQ con reintentos"""
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            parameters = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            connection = pika.BlockingConnection(parameters)
            logger.info(f"Conexión establecida con RabbitMQ en {RABBITMQ_HOST}:{RABBITMQ_PORT}")
            return connection
        except Exception as e:
            logger.warning(f"Intento {attempt + 1}/{max_retries} falló: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logger.error("No se pudo conectar a RabbitMQ después de varios intentos")
                raise


def get_retry_count(properties) -> int:
    """Obtiene el número de reintentos del mensaje desde los headers"""
    if properties.headers and 'x-retry-count' in properties.headers:
        return properties.headers['x-retry-count']
    return 0


def send_response_to_thread(thread_id: str, user_id: str, response: str):
    """Envía la respuesta directamente como mensaje al thread usando la API del servicio de mensajes"""
    try:
        # Validar que thread_id sea un UUID válido
        thread_uuid = uuid.UUID(thread_id)
        bot_uuid = uuid.UUID(CHATBOT_USER_ID)
        
        # Preparar el payload
        payload = {
            "content": response,
            "type": "text",
            "paths": None
        }
        
        # Hacer la llamada HTTP al servicio de mensajes
        url = f"{MESSAGES_SERVICE_URL}/threads/{thread_uuid}/messages"
        headers = {
            "X-User-Id": str(bot_uuid),  # Usar el user_id del bot
            "Content-Type": "application/json"
        }
        
        logger.info("=" * 80)
        logger.info("ENVIANDO RESPUESTA AL THREAD")
        logger.info("=" * 80)
        logger.info(f"URL: {url}")
        logger.info(f"Thread ID: {thread_id}")
        logger.info(f"Respuesta: {len(response)} caracteres")
        
        with httpx.Client(timeout=30.0) as client:
            http_response = client.post(url, json=payload, headers=headers)
            
            if http_response.status_code == 201:
                logger.info("✅ RESPUESTA ENVIADA EXITOSAMENTE AL THREAD")
                logger.info(f"Status: {http_response.status_code}")
                logger.info("=" * 80)
            else:
                logger.error(f"❌ Error al enviar respuesta: {http_response.status_code}")
                logger.error(f"Response: {http_response.text}")
                logger.info("=" * 80)
                
    except ValueError as e:
        logger.error(f"Error: UUID inválido - {e}")
    except httpx.RequestError as e:
        logger.error(f"Error de conexión al servicio de mensajes: {e}")
    except Exception as e:
        logger.error(f"Error inesperado al enviar respuesta: {e}")


def publish_response_event(channel, question: str, response: str, question_id: str):
    """Publica la respuesta de Gemini como evento en la cola de respuestas (fallback)"""
    try:
        message_body = {
            "question_id": question_id,
            "question": question,
            "response": response,
            "timestamp": time.time(),
            "processed_by": "chatbot_service"
        }
        
        channel.basic_publish(
            exchange='',
            routing_key=RESPONSES_QUEUE,
            body=json.dumps(message_body),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Mensaje persistente
                content_type='application/json'
            )
        )
        
        logger.info("=" * 80)
        logger.info("EVENTO DE RESPUESTA PUBLICADO (FALLBACK)")
        logger.info("=" * 80)
        logger.info(f"Cola: {RESPONSES_QUEUE}")
        logger.info(f"Question ID: {question_id}")
        logger.info(f"Respuesta: {len(response)} caracteres")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Error al publicar respuesta (fallback): {e}")
        raise


def callback(ch, method, properties, body):
    """Callback que se ejecuta cuando llega un mensaje de la cola de preguntas"""
    retry_count = get_retry_count(properties)
    
    try:
        message_data = json.loads(body)

        thread_id = None
        user_id = None
        question = None
        question_id = None

        # Formato 1: Mensaje de INF326-tarea-2-main (viene el objeto message directamente)
        if "thread_id" in message_data and "content" in message_data:
            thread_id = str(message_data.get("thread_id", ""))
            user_id = str(message_data.get("user_id", ""))
            question = message_data.get("content", "")
            question_id = str(message_data.get("id", "unknown"))
        # Formato 2: Mensaje original del quiz_service
        elif "question" in message_data:
            question = message_data.get("question", "")
            question_id = message_data.get("question_id", "unknown")
        else:
            # Formato desconocido, intentar un fallback
            question = str(message_data)
            question_id = "unknown"
        
        logger.info("=" * 80)
        logger.info("NUEVO MENSAJE RECIBIDO")
        logger.info("=" * 80)
        logger.info(f"Question ID: {question_id}")
        logger.info(f"Thread ID: {thread_id}")
        logger.info(f"User ID: {user_id}")
        logger.info(f"Reintento: {retry_count}/{MAX_RETRIES}")
        logger.info(f"PREGUNTA: {question}")
        logger.info("-" * 80)
        
        if not question:
            logger.warning("Pregunta vacía, descartando mensaje.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Procesar con Gemini
        logger.info("Procesando con Gemini AI...")
        response = process_question_with_gemini(question)
        
        logger.info("RESPUESTA DE GEMINI:")
        logger.info("-" * 80)
        logger.info(response)
        logger.info("=" * 80)
        
        # Enviar respuesta directamente al thread si tenemos thread_id
        if thread_id and user_id:
            send_response_to_thread(thread_id, user_id, response)
        else:
            # Fallback: publicar en cola de respuestas (comportamiento original)
            logger.warning("No se encontró thread_id/user_id, publicando en cola de respuestas de fallback.")
            publish_response_event(ch, question, response, question_id)
        
        # Confirmar mensaje procesado
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.info("MENSAJE PROCESADO (ACK)")
        logger.info("=" * 80)
        logger.info("")
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"ERROR: {e}")
        logger.error("=" * 80)
        
        # Verificar si se debe reintentar o enviar a DLX
        if retry_count < MAX_RETRIES:
            logger.warning(f"Reintentando... ({retry_count + 1}/{MAX_RETRIES})")
            
            # Crear headers con contador incrementado
            headers = properties.headers or {}
            headers['x-retry-count'] = retry_count + 1
            
            # Usar la cola desde la cual se recibió el mensaje (routing_key del método)
            retry_queue = method.routing_key if hasattr(method, 'routing_key') and method.routing_key else QUESTIONS_QUEUE
            
            # Republicar mensaje con nuevo contador
            ch.basic_publish(
                exchange='',
                routing_key=retry_queue,
                body=body,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    headers=headers,
                    content_type='application/json'
                )
            )
            
            # Rechazar mensaje original (no requeue porque ya lo republicamos)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            logger.info(f"Mensaje reencolado (intento {retry_count + 1})")
        else:
            # Máximo de reintentos alcanzado, enviar a DLX
            logger.error(f"Máximo de reintentos. Enviando a DLX...")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        logger.info("=" * 80)
        logger.info("")


def start_consumer():
    """Inicia el consumidor de RabbitMQ en un hilo separado"""
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        
        # Las colas ya están declaradas en definitions.json
        # Pero verificamos que existan (passive=True no crea, solo verifica)
        channel.queue_declare(queue=QUESTIONS_QUEUE, durable=True, passive=True)
        
        # Configurar QoS para procesar un mensaje a la vez
        channel.basic_qos(prefetch_count=1)
        
        # Configurar el consumidor
        channel.basic_consume(queue=QUESTIONS_QUEUE, on_message_callback=callback, auto_ack=False)
        
        logger.info("=" * 80)
        logger.info("CONSUMIDOR RABBITMQ INICIADO")
        logger.info("=" * 80)
        logger.info(f"Escuchando: {QUESTIONS_QUEUE}")
        logger.info(f"Publicando en: {RESPONSES_QUEUE}")
        logger.info(f"DLX: {DLX_EXCHANGE}")
        logger.info(f"Max reintentos: {MAX_RETRIES}")
        logger.info("=" * 80)
        logger.info("")
        
        channel.start_consuming()
        
    except Exception as e:
        logger.error(f"Error en el consumidor: {e}")
        time.sleep(5)
        # Reintentar
        start_consumer()


@app.on_event("startup")
async def startup_event():
    """Inicia el consumidor de RabbitMQ cuando la aplicación arranca"""
    consumer_thread = threading.Thread(target=start_consumer, daemon=True)
    consumer_thread.start()
    logger.info("Hilo consumidor de RabbitMQ iniciado")


@app.get("/health")
async def health() -> dict:
    """Simple readiness endpoint for orchestrators."""

    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar un mensaje para obtener una respuesta.",
        )

    prompt = build_prompt(request.message)

    try:
        response = get_genai_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
    except HTTPException:
        raise
    except Exception as exc:  
        logger.exception("Gemini request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="El modelo no pudo generar una respuesta en este momento.",
        ) from exc

    reply = (response.text or "").strip() if hasattr(response, "text") else ""
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="El modelo no entregó contenido en la respuesta.",
        )

    return ChatResponse(reply=reply)