import logging
import os
import time
import json
import threading
from functools import lru_cache

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
    description="Wrapper de FastAPI para consumir el modelo Gemini",
    version="1.0.0",
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

# Configuración RabbitMQ desde variables de entorno
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
QUEUE_NAME = "quiz_questions"


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@lru_cache(maxsize=1) #evita recrear el cliente en cada petición
def get_genai_client() -> genai.Client:
    """Create (and memoize) the Gemini client using the GEMINI_API_KEY env var."""

    try:
        return genai.Client()
    except Exception as exc:  # pragma: no cover - defensive logging
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
            return "El modelo no entregó contenido en la respuesta."
        
        return reply
    except Exception as e:
        logger.error(f"Error al procesar con Gemini: {e}")
        return f"Error al procesar la pregunta: {str(e)}"


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


def callback(ch, method, properties, body):
    """Callback que se ejecuta cuando llega un mensaje de la cola"""
    try:
        message_data = json.loads(body)
        question = message_data.get("question", "")
        
        logger.info("=" * 80)
        logger.info("NUEVO MENSAJE RECIBIDO DE LA COLA")
        logger.info("=" * 80)
        logger.info(f"PREGUNTA: {question}")
        logger.info("-" * 80)
        
        # Procesar la pregunta con Gemini
        logger.info("Procesando con Gemini AI...")
        response = process_question_with_gemini(question)
        
        logger.info("RESPUESTA DE GEMINI:")
        logger.info("-" * 80)
        logger.info(response)
        logger.info("=" * 80)
        logger.info("MENSAJE PROCESADO EXITOSAMENTE")
        logger.info("=" * 80)
        logger.info("")  # Línea en blanco para separar mensajes
        
        # Confirmar el mensaje
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"ERROR AL PROCESAR MENSAJE: {e}")
        logger.error("=" * 80)
        # No hacer ack para reintentar el mensaje
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_consumer():
    """Inicia el consumidor de RabbitMQ en un hilo separado"""
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        
        # Declarar la cola (idempotente)
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        
        # Configurar QoS para procesar un mensaje a la vez
        channel.basic_qos(prefetch_count=1)
        
        # Configurar el consumidor
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
        
        logger.info("=" * 80)
        logger.info("CONSUMIDOR RABBITMQ INICIADO CORRECTAMENTE")
        logger.info(f"Esperando mensajes en la cola: '{QUEUE_NAME}'")
        logger.info("Presiona Ctrl+C para detener")
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
    except Exception as exc:  # pragma: no cover - depends on external API
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