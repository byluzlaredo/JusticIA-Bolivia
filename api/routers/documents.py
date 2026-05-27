import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from api.models import DocumentRequest
from api.routers.auth import get_current_user
from api.database import get_laboral_connection

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Crear carpeta de documentos si no existe
DOCS_DIR = os.path.join(os.getcwd(), "api", "static", "generated_docs")
os.makedirs(DOCS_DIR, exist_ok=True)

@router.post("/generate")
async def generate_document(req: DocumentRequest, user: dict = Depends(get_current_user)):
    filename = f"{req.tipo}_{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(DOCS_DIR, filename)
    
    # Generar PDF con ReportLab
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    
    if req.tipo.lower() == "renuncia":
        c.drawString(50, height - 80, "CARTA DE RENUNCIA")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 120, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
        c.drawString(50, height - 150, "A quien corresponda,")
        c.drawString(50, height - 180, f"Yo, {req.nombre_completo}, con C.I. {req.ci},")
        c.drawString(50, height - 200, f"presento formalmente mi renuncia al cargo de {req.cargo}.")
        c.drawString(50, height - 220, f"Mi fecha de ingreso fue el {req.fecha_ingreso or '---'} y mi último día")
        c.drawString(50, height - 240, f"será el {req.fecha_salida or '---'}.")
        c.drawString(50, height - 270, f"Motivo: {req.motivo}")
        c.drawString(50, height - 320, "Atentamente,")
        c.drawString(50, height - 380, "___________________________")
        c.drawString(50, height - 400, req.nombre_completo)
        
    elif req.tipo.lower() == "solicitud":
        c.drawString(50, height - 80, "SOLICITUD DE VACACIONES / PERMISO")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 120, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
        c.drawString(50, height - 160, f"Yo, {req.nombre_completo}, con C.I. {req.ci},")
        c.drawString(50, height - 180, f"en el cargo de {req.cargo}, solicito formalmente un permiso/vacación")
        c.drawString(50, height - 200, f"por el motivo de: {req.motivo}")
        c.drawString(50, height - 250, "Firma del Trabajador: ___________________________")
        
    else:
        c.drawString(50, height - 80, "DOCUMENTO GENÉRICO")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 120, f"Nombre: {req.nombre_completo}")
        c.drawString(50, height - 140, f"Motivo: {req.motivo}")
        
    c.save()
    
    # Guardar registro en la BD (Módulo 5.6 y 5.8)
    conn = get_laboral_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO documento_laboral (id_usuario, tipo_documento, contenido)
            VALUES (%s, %s, %s)
        """, (user["id_usuario"], req.tipo, filepath))
        conn.commit()
    except Exception as e:
        print("Error guardando doc en BD:", e)
    finally:
        conn.close()
    
    return {"message": "Documento generado exitosamente", "download_url": f"/static/generated_docs/{filename}"}
