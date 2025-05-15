# ───────────── Stage 1: build + test ─────────────
FROM python:3.11-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends libmariadb-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# – include *only* test tools in builder image –
RUN pip install --no-cache-dir pytest

# Copy source late for better layer caching
COPY . .

# ───────────── Stage 2: runtime image ─────────────
FROM python:3.11-slim

# tini for PID 1 signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends tini libmariadb-dev && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -ms /bin/bash app
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

EXPOSE 8000
USER app
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
