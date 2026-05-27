from fastapi import APIRouter
from api.models import ConfigModel

router = APIRouter(prefix="/api/config", tags=["config"])

# Para propósitos de demo, guardamos la config en memoria. 
# En producción iría a la base de datos (Ej. tabla configuracion)
current_config = ConfigModel()

@router.get("/")
async def get_config():
    return current_config

@router.post("/")
async def update_config(config: ConfigModel):
    global current_config
    current_config = config
    return {"message": "Configuración actualizada correctamente", "config": current_config}
