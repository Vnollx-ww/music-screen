# Build:
# docker build -t music-screen-backend .
#
# Tag:
# docker tag music-screen-backend:latest vnollx/music-screen-backend:1.0
#
# Push:
# docker push vnollx/music-screen-backend:1.0
#
# Run example:
# docker run --rm -p 8000:8000 --env-file .env music-screen-backend

FROM python:3.12-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m pip install --no-cache-dir --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY sql ./sql

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
