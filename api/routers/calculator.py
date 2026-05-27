import json
from datetime import datetime
from fastapi import APIRouter, Depends
from api.models import CalcRequest
from api.routers.auth import get_current_user
from api.database import get_laboral_connection

router = APIRouter(prefix="/api/calculators", tags=["calculators"])

@router.post("/benefits")
async def calculate_benefits(req: CalcRequest, user: dict = Depends(get_current_user)):
    try:
        fmt = "%Y-%m-%d"
        ingreso = datetime.strptime(req.fecha_ingreso, fmt)
        salida = datetime.strptime(req.fecha_salida, fmt)
        dias_trabajados = (salida - ingreso).days
    except Exception:
        return {"error": "Formato de fecha inválido. Use YYYY-MM-DD"}
        
    if dias_trabajados < 0:
        return {"error": "La fecha de salida debe ser posterior a la de ingreso."}
        
    anios = dias_trabajados // 365
    meses = (dias_trabajados % 365) // 30
    dias = (dias_trabajados % 365) % 30
    
    # Cálculo Básico Simplificado de Beneficios Sociales (Bolivia)
    # Indemnización: 1 salario por año trabajado (o duodécimas)
    # Aguinaldo: 1 salario si trabajó todo el año (o duodécimas)
    
    indemnizacion = (req.salario_base / 360) * dias_trabajados
    
    # Aguinaldo proporcional al último año
    dias_ultimo_anio = dias_trabajados % 360
    aguinaldo = (req.salario_base / 360) * dias_ultimo_anio
    
    # Vacaciones (simplificado: 15 días por año para los primeros 5 años)
    dias_vacacion_pendientes = (15 / 360) * dias_ultimo_anio
    pago_vacaciones = (req.salario_base / 30) * dias_vacacion_pendientes
    
    total = indemnizacion + aguinaldo + pago_vacaciones
    
    if req.motivo_salida.lower() == "renuncia" and dias_trabajados < 90:
        # Menos de 90 días normalmente no hay indemnización en renuncia voluntaria
        indemnizacion = 0
        total = aguinaldo + pago_vacaciones
        
    resultado_json = {
        "tiempo_trabajado": f"{anios} años, {meses} meses, {dias} días",
        "indemnizacion": round(indemnizacion, 2),
        "aguinaldo": round(aguinaldo, 2),
        "pago_vacaciones": round(pago_vacaciones, 2),
        "total_beneficios": round(total, 2)
    }
    
    # Guardar en base de datos
    conn = get_laboral_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO calculo_laboral (id_usuario, tipo_calculo, resultado, detalle)
            VALUES (%s, %s, %s, %s)
        """, (user["id_usuario"], "Finiquito", total, json.dumps(resultado_json)))
        conn.commit()
    except Exception as e:
        print("Error guardando cálculo:", e)
    finally:
        conn.close()
        
    return resultado_json
