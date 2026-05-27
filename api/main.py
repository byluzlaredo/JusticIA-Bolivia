import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, config, chat, documents, calculator

app = FastAPI(title="RAG Legal Bolivia - Sistema Laboral")

# CORS (para demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Routers
app.include_router(auth.router)
app.include_router(config.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(calculator.router)

# Crear carpeta static si no existe
STATIC_DIR = os.path.join(os.getcwd(), "api", "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Montar estáticos
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
