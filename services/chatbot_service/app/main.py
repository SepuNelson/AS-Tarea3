import logging
from functools import lru_cache

from fastapi import FastAPI, HTTPException, status
from google import genai
from pydantic import BaseModel

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