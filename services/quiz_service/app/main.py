import os
import time
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import pika
import json

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Quiz Service",
    description="Servicio auxiliar que entrega una pregunta aleatoria",
    version="1.0.0"
)

QUESTIONS = [
    "Revisa si este código es correcto y corrígelo: print('Hola Mundo\");",
    "Completa este código en Python para que sume dos números ingresados por el usuario: a = int(input('Ingresa un número: ')); b = int(input('Ingresa otro número: '))",
    "Encuentra el error en este fragmento y corrígelo: for i in range(5) print(i)",
    "En Python, crea una función llamada es_palindromo que reciba una cadena y retorne True si es un palíndromo y False en caso contrario.",
    "Optimiza este código para calcular cuadrados de una lista usando list comprehension: numeros = [1,2,3,4,5]; cuadrados = []; for n in numeros: cuadrados.append(n**2)"
]

# Configuración RabbitMQ desde variables de entorno
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
QUEUE_NAME = "quiz_questions"


class QuestionRequest(BaseModel):
    """Modelo para solicitar una pregunta"""
    pass


class QuestionResponse(BaseModel):
    """Modelo de respuesta"""
    message: str
    question: str


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


def publish_question(question: str):
    """Publica una pregunta en la cola de RabbitMQ"""
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        
        # Declarar la cola (idempotente)
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        
        # Publicar el mensaje
        message = json.dumps({"question": question})
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Hacer el mensaje persistente
            )
        )
        
        logger.info(f"Pregunta publicada en la cola: {question}")
        connection.close()
        
    except Exception as e:
        logger.error(f"Error al publicar mensaje: {e}")
        raise HTTPException(status_code=500, detail=f"Error al publicar pregunta: {str(e)}")


@app.get("/questions", response_model=QuestionResponse)
def get_questions():
    """
    Selecciona una pregunta aleatoria y la envía a RabbitMQ para ser procesada
    por el chatbot_service.
    """
    selected = random.choice(QUESTIONS)
    
    try:
        publish_question(selected)
        return QuestionResponse(
            message="Pregunta enviada al servicio de chatbot para procesamiento",
            question=selected
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))