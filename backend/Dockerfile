FROM python:3.11-slim-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libmariadb-dev curl tini && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ❶ install runtime + test deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir pytest          # ← add pytest here

# ❷ copy *everything* so the tests directory is inside the image
COPY . .

EXPOSE 8000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]