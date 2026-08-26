import os
import json
import asyncio
import base64
import urllib.request
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agentes import grafo_agentes

app = FastAPI(title="InvestigaBot: Investigación de Mercado")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class PeticionInvestigacion(BaseModel):
    tema: str
    longitud: str = "estándar"
    incluir_imagenes: bool = True
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

@app.get("/")
def inicio():
    return {"mensaje": "InvestigaBot está activo y listo."}

@app.get("/proxy-imagen")
def proxy_imagen(url: str):
    """Proxy para descargar imágenes y devolverlas en Base64."""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            content_type = response.info().get_content_type() or 'image/jpeg'
            img_bytes = response.read()
            b64_str = base64.b64encode(img_bytes).decode('utf-8')
            return {"data_url": f"data:{content_type};base64,{b64_str}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo descargar la imagen: {str(e)}")

@app.post("/investigar")
async def iniciar_investigacion(peticion: PeticionInvestigacion):
    """Ejecuta el grafo de agentes transmitiendo el progreso vía SSE."""
    tema = peticion.tema
    if not tema.strip():
        raise HTTPException(status_code=400, detail="El tema no puede estar vacío.")

    async def generador_eventos():
        try:
            estado_inicial = {
                "tema": tema,
                "longitud": peticion.longitud,
                "incluir_imagenes": peticion.incluir_imagenes,
                "datos_recopilados": [],
                "imagenes": [],
                "analisis": {},
                "reporte_final": "",
                "historial_pasos": [],
                "agente_actual": "Sistema",
                "clave_gemini": peticion.gemini_api_key,
                "clave_tavily": peticion.tavily_api_key
            }
            
            yield f"data: {json.dumps({'evento': 'inicio', 'agente': 'Sistema', 'mensaje': f'Iniciando investigación sobre: {tema}'})}\n\n"
            await asyncio.sleep(0.5)

            reporte_generado = ""
            
            async for paso in grafo_agentes.astream(estado_inicial):
                for nombre_nodo, salida in paso.items():
                    mensaje = ""
                    if nombre_nodo == "investigador":
                        mensaje = "Búsqueda web completada. Noticias e información recopilada exitosamente."
                    elif nombre_nodo == "analista":
                        mensaje = "Análisis de datos y cálculo de sentimiento del mercado finalizados."
                    elif nombre_nodo == "redactor":
                        mensaje = "Redacción del reporte final en Markdown completada."
                    
                    if isinstance(salida, dict) and "reporte_final" in salida:
                        reporte_generado = salida["reporte_final"]
                    
                    payload = {
                        'evento': 'progreso',
                        'agente': nombre_nodo.capitalize(),
                        'mensaje': mensaje,
                        'salida': salida
                    }
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.5)
            
            yield f"data: {json.dumps({'evento': 'fin', 'agente': 'Sistema', 'mensaje': 'Investigación y reporte finalizados con éxito.', 'reporte_final': reporte_generado}, ensure_ascii=False)}\n\n"

        except Exception as e:
            import logging
            error_msg = f"Error durante la orquestación: {str(e)}"
            logging.error(error_msg)
            yield f"data: {json.dumps({'evento': 'error', 'mensaje': error_msg}, ensure_ascii=False)}\n\n"

    return StreamingResponse(generador_eventos(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("servidor:app", host="0.0.0.0", port=8000, reload=True)
