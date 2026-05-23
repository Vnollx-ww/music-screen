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
# docker run --rm -p 6060:6060 music-screen-backend

FROM python:3.12-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m pip install --no-cache-dir --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./
COPY .env ./
COPY app ./app
COPY sql ./sql

EXPOSE 6060

CMD ["python", "app.py"]
