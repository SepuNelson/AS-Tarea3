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

<<<<<<< HEAD
# Configuración RabbitMQ
=======
# Configuración RabbitMQ desde variables de entorno
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
<<<<<<< HEAD

# colas
QUESTIONS_QUEUE = os.getenv("QUESTIONS_QUEUE", "quiz_questions")
RESPONSES_QUEUE = os.getenv("RESPONSES_QUEUE", "gemini_responses")
FAILED_QUESTIONS_QUEUE = os.getenv("FAILED_QUESTIONS_QUEUE", "failed_questions_queue")
FAILED_RESPONSES_QUEUE = os.getenv("FAILED_RESPONSES_QUEUE", "failed_responses_queue")

# Configuración DLX
DLX_EXCHANGE = os.getenv("DLX_EXCHANGE", "dlx_exchange")
MAX_RETRIES = 3
=======
QUEUE_NAME = "quiz_questions"
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac


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
<<<<<<< HEAD
            # Considerar una respuesta vacía como un error para que sea reintentado
            raise ValueError("El modelo no entregó contenido en la respuesta.")
        
        return reply
    except Exception as e:
        # Registrar el error y RE-LANZAR la excepción
        # Esto es crucial para que el callback active la lógica de reintentos/DLX
        logger.error(f"Error al procesar con Gemini: {e}")
        raise
=======
            return "El modelo no entregó contenido en la respuesta."
        
        return reply
    except Exception as e:
        logger.error(f"Error al procesar con Gemini: {e}")
        return f"Error al procesar la pregunta: {str(e)}"
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac


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


<<<<<<< HEAD
def get_retry_count(properties) -> int:
    """Obtiene el número de reintentos del mensaje desde los headers"""
    if properties.headers and 'x-retry-count' in properties.headers:
        return properties.headers['x-retry-count']
    return 0


def publish_response_event(channel, question: str, response: str, question_id: str):
    """Publica la respuesta de Gemini como evento en la cola de respuestas"""
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
        logger.info("EVENTO DE RESPUESTA PUBLICADO")
        logger.info("=" * 80)
        logger.info(f"Cola: {RESPONSES_QUEUE}")
        logger.info(f"Question ID: {question_id}")
        logger.info(f"Respuesta: {len(response)} caracteres")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Error al publicar respuesta: {e}")
        raise
def callback(ch, method, properties, body):
    """Callback que se ejecuta cuando llega un mensaje de la cola de preguntas"""
    retry_count = get_retry_count(properties)
    
    try:
        message_data = json.loads(body)
        question = message_data.get("question", "")
        question_id = message_data.get("question_id", "unknown")
        
        logger.info("=" * 80)
        logger.info("NUEVO MENSAJE RECIBIDO")
        logger.info("=" * 80)
        logger.info(f"Question ID: {question_id}")
        logger.info(f"Reintento: {retry_count}/{MAX_RETRIES}")
        logger.info(f"PREGUNTA: {question}")
        logger.info("-" * 80)
        
        # Procesar con Gemini
=======
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
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac
        logger.info("Procesando con Gemini AI...")
        response = process_question_with_gemini(question)
        
        logger.info("RESPUESTA DE GEMINI:")
        logger.info("-" * 80)
        logger.info(response)
        logger.info("=" * 80)
<<<<<<< HEAD
        
        # Publicar respuesta como evento
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
            
            # Republicar mensaje con nuevo contador
            ch.basic_publish(
                exchange='',
                routing_key=QUESTIONS_QUEUE,
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
=======
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
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac


def start_consumer():
    """Inicia el consumidor de RabbitMQ en un hilo separado"""
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        
<<<<<<< HEAD
        # Las colas ya están declaradas en definitions.json
        # Pero verificamos que existan (passive=True no crea, solo verifica)
        channel.queue_declare(queue=QUESTIONS_QUEUE, durable=True, passive=True)
=======
        # Declarar la cola (idempotente)
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac
        
        # Configurar QoS para procesar un mensaje a la vez
        channel.basic_qos(prefetch_count=1)
        
        # Configurar el consumidor
<<<<<<< HEAD
        channel.basic_consume(queue=QUESTIONS_QUEUE, on_message_callback=callback, auto_ack=False)
        
        logger.info("=" * 80)
        logger.info("CONSUMIDOR RABBITMQ INICIADO")
        logger.info("=" * 80)
        logger.info(f"Escuchando: {QUESTIONS_QUEUE}")
        logger.info(f"Publicando en: {RESPONSES_QUEUE}")
        logger.info(f"DLX: {DLX_EXCHANGE}")
        logger.info(f"Max reintentos: {MAX_RETRIES}")
=======
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
        
        logger.info("=" * 80)
        logger.info("CONSUMIDOR RABBITMQ INICIADO CORRECTAMENTE")
        logger.info(f"Esperando mensajes en la cola: '{QUEUE_NAME}'")
        logger.info("Presiona Ctrl+C para detener")
>>>>>>> 87b4d782e874dbafc1df7b2d10f9e91cfda5b8ac
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