from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserRegister(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    contrasena: str

class UserLogin(BaseModel):
    correo: EmailStr
    contrasena: str

class ChatRequest(BaseModel):
    pregunta: str

class DocumentRequest(BaseModel):
    tipo: str # renuncia, solicitud
    nombre_completo: str
    ci: str
    cargo: str
    motivo: Optional[str] = "Motivos personales"
    fecha_ingreso: Optional[str] = None
    fecha_salida: Optional[str] = None

class CalcRequest(BaseModel):
    salario_base: float
    fecha_ingreso: str
    fecha_salida: str
    motivo_salida: str # despido, renuncia

class ConfigModel(BaseModel):
    temperature: float = 0.5
    max_tokens: int = 500
    model: str = "llama3"
