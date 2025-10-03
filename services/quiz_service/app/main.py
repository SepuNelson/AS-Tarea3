from fastapi import FastAPI
import random

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

@app.get("/questions")
def get_questions():
    """
    Devuelve una pregunta aleatoria (Simula una pregunta del Cliente).
    """
    selected = random.choice(QUESTIONS)
    return {"question": selected}