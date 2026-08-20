# ---- Stage 1: build the frontend -------------------------------------
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build
# Vite is configured (vite.config.ts) to emit straight into
# ../backend/static, so the output already lands at /app/backend/static.

# ---- Stage 2: the actual app -------------------------------------------
FROM python:3.12-slim AS runtime

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libjpeg62-turbo zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY --from=frontend-build /app/backend/static ./static

# Runs as a normal user, not root, since it writes into the host's real
# Steam folder - keep the blast radius of any bug as small as possible.
RUN useradd --create-home --uid 1000 vapor
USER vapor

EXPOSE 8010

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010"]
