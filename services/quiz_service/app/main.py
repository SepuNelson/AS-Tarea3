from fastapi import FastAPI
import random

app = FastAPI(
    title="Quiz Service",
    description="Servicio auxiliar que entrega preguntas aleatorias",
    version="1.0.0"
)

# Base de preguntas (puedes ir ampliando la lista)
QUESTIONS = [
    "Revisa si este código es correcto y corrígelo: print('Hola Mundo\");",
    "Completa este código en Python para que sume dos números ingresados por el usuario: a = int(input('Ingresa un número: ')); b = int(input('Ingresa otro número: '))",
    "Encuentra el error en este fragmento y corrígelo: for i in range(5) print(i)",
    "En Python, crea una función llamada es_palindromo que reciba una cadena y retorne True si es un palíndromo y False en caso contrario.",
    "Optimiza este código para calcular cuadrados de una lista usando list comprehension: numeros = [1,2,3,4,5]; cuadrados = []; for n in numeros: cuadrados.append(n**2)"
]

@app.get("/questions")
def get_questions():
    """
    Devuelve n preguntas aleatorias.
    - n: número de preguntas solicitadas (máximo las disponibles).
    """
    selected = random.sample(QUESTIONS)
    return {"questions": selected}