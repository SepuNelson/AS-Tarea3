# Imagen base de Python
FROM python:3.11-slim

# Crear directorio de la app
WORKDIR /app

# Copiar dependencias (desde este mismo directorio)
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el microservicio (app y test)
COPY . .

# Comando para ejecutar el servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]