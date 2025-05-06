# Use a slim official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements (adjust if you’re using poetry/pyproject.toml instead)
COPY requirements.txt .

# Install runtime dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port that Uvicorn will run on
EXPOSE 8000

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
