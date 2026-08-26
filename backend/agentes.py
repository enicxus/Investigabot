import os
from typing import TypedDict, List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

import logging

# Cargar .env
ruta_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ruta_env):
    load_dotenv(ruta_env)
else:
    load_dotenv()

def obtener_llm(clave_personalizada: Optional[str] = None):
    """Instancia el cliente de Gemini."""
    clave = (clave_personalizada or "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
    if not clave or "tu_clave" in clave.lower():
        error_msg = "No has configurado tu GEMINI_API_KEY (ni en la interfaz web ni en backend/.env). Por favor ingresa una clave válida obtenida gratis en Google AI Studio."
        logging.error(error_msg)
        raise ValueError(error_msg)
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1,
        google_api_key=clave,
        max_retries=5
    )

# Estado del grafo
class EstadoInvestigacion(TypedDict):
    tema: str
    longitud: str
    incluir_imagenes: bool
    datos_recopilados: List[str]
    imagenes: List[str]
    analisis: Dict[str, Any]
    reporte_final: str
    historial_pasos: List[str]
    agente_actual: str
    clave_gemini: Optional[str]
    clave_tavily: Optional[str]

# Herramientas

def buscar_en_web(consulta: str, clave_tavily_custom: Optional[str] = None, clave_gemini_custom: Optional[str] = None, extraer_imagenes: bool = False) -> tuple[str, List[str]]:
    """Búsqueda web con Tavily o fallback con LLM."""
    clave_tavily = (clave_tavily_custom or "").strip() or os.getenv("TAVILY_API_KEY", "").strip()
    imagenes_encontradas: List[str] = []
    
    if clave_tavily and "tu_clave" not in clave_tavily.lower():
        try:
            from tavily import TavilyClient
            cliente_tavily = TavilyClient(api_key=clave_tavily)
            respuesta = cliente_tavily.search(
                query=consulta, 
                max_results=8, 
                search_depth="advanced",
                include_images=extraer_imagenes
            )
            
            formato_resultados = []
            for r in respuesta.get("results", []):
                titulo = r.get("title", "Sin título")
                url = r.get("url", "")
                contenido = r.get("content", "")
                formato_resultados.append(f"- **Título:** {titulo}\n  **URL:** {url}\n  **Contenido:** {contenido}")
            
            if extraer_imagenes:
                raw_imgs = respuesta.get("images", [])
                for img in raw_imgs:
                    if isinstance(img, str) and img.startswith("http"):
                        imagenes_encontradas.append(img)
                    elif isinstance(img, dict) and img.get("url", "").startswith("http"):
                        imagenes_encontradas.append(img["url"])

            if formato_resultados:
                logging.info(f"Búsqueda web en vivo con Tavily completada para '{consulta}' ({len(formato_resultados)} resultados, {len(imagenes_encontradas)} imágenes reales).")
                return "\n\n".join(formato_resultados), imagenes_encontradas
        except Exception as e:
            logging.warning(f"Error con Tavily API: {e}. Usando simulador de búsqueda por defecto.")
    
    # Fallback: búsqueda sintética con LLM si no hay API key de Tavily
    prompt = f"""
    Actúa como un asistente de investigación estricto. Proporciona un resumen de información real, objetiva y verídica que conozcas sobre: "{consulta}".
    
    REGLA CRÍTICA: NO inventes información, NO crees artículos ficticios, ni simules fuentes de noticias que no existan.
    Si el tema es muy reciente, una jerga de internet (como "farmear aura"), o algo de lo que no tienes información comprobable, DEBES responder textualmente: "No se encontró información suficiente y confiable sobre este tema en mi base de datos."
    
    Responde en español y prioriza la verdad absoluta por encima de generar contenido extenso.
    """
    try:
        instancia_llm = obtener_llm(clave_gemini_custom)
        respuesta = instancia_llm.invoke([SystemMessage(content="Eres un simulador de búsqueda web de alta calidad en español."), HumanMessage(content=prompt)])
        texto_resultado = respuesta.content
    except Exception as e:
        texto_resultado = f"Error en la simulación de búsqueda: {e}. Resultados por defecto sobre {consulta}."

    return texto_resultado, []

# Nodos del grafo

def agente_investigador(estado: EstadoInvestigacion) -> Dict[str, Any]:
    tema = estado["tema"]
    historial = estado.get("historial_pasos", [])
    clave_tavily = estado.get("clave_tavily")
    clave_gemini = estado.get("clave_gemini")
    incluir_imagenes = estado.get("incluir_imagenes", True)
    
    paso = "El Agente Investigador está recopilando noticias, fuentes e imágenes web..." if incluir_imagenes else "El Agente Investigador está recopilando noticias y fuentes..."
    logging.info(f"[Investigador] Recopilando datos sobre: {tema} (imágenes={incluir_imagenes})")
    
    res_1, imgs_1 = buscar_en_web(f"últimas noticias sobre {tema}", clave_tavily, clave_gemini, extraer_imagenes=incluir_imagenes)
    res_2, imgs_2 = buscar_en_web(f"tendencias y mercado de {tema}", clave_tavily, clave_gemini, extraer_imagenes=incluir_imagenes)
    
    nuevos_datos = [res_1, res_2]
    
    todas_imagenes = []
    if incluir_imagenes:
        for img_url in (imgs_1 + imgs_2):
            if img_url and img_url not in todas_imagenes and img_url.startswith("http"):
                todas_imagenes.append(img_url)
    
    return {
        "datos_recopilados": nuevos_datos,
        "imagenes": todas_imagenes,
        "historial_pasos": historial + [paso],
        "agente_actual": "Investigador"
    }

def agente_analista(estado: EstadoInvestigacion) -> Dict[str, Any]:
    tema = estado["tema"]
    datos = estado["datos_recopilados"]
    historial = estado.get("historial_pasos", [])
    clave_gemini = estado.get("clave_gemini")
    
    paso = "El Agente Analista está verificando la información y calculando el sentimiento..."
    logging.info(f"[Analista] Verificando información y analizando sentimiento.")
    
    datos_unidos = "\n\n".join(datos)
    
    prompt = f"""
    Analiza la siguiente información recopilada sobre el tema: "{tema}".
    
    Información:
    {datos_unidos}
    
    Debes estructurar tu análisis respondiendo en formato JSON (pero texto limpio o Markdown ligero) con:
    1. VALIDACIÓN INTERNA: Filtra y consolida solo hechos respaldados, descartando rumores o datos sin sustento.
    2. SENTIMIENTO: Sentimiento general del mercado/noticias (Positivo, Negativo o Neutro) con justificación y porcentaje estimado.
    3. DATOS CLAVE: Lista de los 3 a 5 hallazgos numéricos o hechos más importantes.
    
    Escribe el análisis completamente en español y de forma muy profesional.
    """
    
    instancia_llm = obtener_llm(clave_gemini)
    respuesta = instancia_llm.invoke([
        SystemMessage(content="Eres un analista de mercado experto y analista de sentimiento."),
        HumanMessage(content=prompt)
    ])
    
    analisis_resultado = {
        "texto_analisis": respuesta.content,
        "sentimiento": "Analizado"
    }
    
    return {
        "analisis": analisis_resultado,
        "historial_pasos": historial + [paso],
        "agente_actual": "Analista"
    }

def agente_redactor(estado: EstadoInvestigacion) -> Dict[str, Any]:
    tema = estado["tema"]
    datos = estado["datos_recopilados"]
    imagenes = estado.get("imagenes", [])
    incluir_imagenes = estado.get("incluir_imagenes", True)
    analisis = estado["analisis"]["texto_analisis"]
    historial = estado.get("historial_pasos", [])
    clave_gemini = estado.get("clave_gemini")
    
    paso = "El Agente Redactor está generando el reporte final en Markdown..."
    logging.info(f"[Redactor] Redactando reporte final.")
    
    datos_unidos = "\n\n".join(datos)

    if incluir_imagenes and imagenes:
        lista_imgs = "\n".join([f"- {url}" for url in imagenes[:4]])
        directiva_imagenes = f"""
    DIRECTIVA DE IMÁGENES VISUALES:
    El usuario ha solicitado INCLUIR imágenes visuales en el reporte.
    Se han obtenido las siguientes imágenes web reales de los artículos de noticias:
    {lista_imgs}
    
    Debes insertar exactamente 2 imágenes distintas de esta lista (o todas las que haya si hay menos de 2) distribuidas en lugares contextuales diferentes del reporte usando la sintaxis:
    ![Descripción relevante](URL_EXACTA_DE_LA_LISTA)
    *Descripción breve de la imagen*
    
    REGLAS ESTRICTAS DE IMÁGENES:
    1. Inserta exactamente 2 imágenes en secciones distintas (por ejemplo una tras la introducción y otra en hallazgos o tendencias).
    2. Usa EXCLUSIVAMENTE las URLs de la lista anterior.
    3. Si ninguna URL parece adecuada o la lista está vacía, NO generes etiquetas de imagen `![...]` ni inventes URLs ficticias.
    """
    else:
        directiva_imagenes = "DIRECTIVA DE IMÁGENES: No incluyas imágenes en el reporte (el usuario prefirió solo texto o no hay imágenes disponibles)."
    
    prompt = f"""
    Eres un redactor experto. Genera un reporte final y elegante en formato Markdown sobre el tema: "{tema}".
    
    ATENCIÓN A LA LONGITUD: El usuario ha solicitado que este reporte sea de longitud "{estado.get('longitud', 'estándar')}". Adapta tu nivel de detalle, la cantidad de párrafos y la profundidad del análisis para cumplir estrictamente con esta longitud.
    
    {directiva_imagenes}

    Usa la siguiente información recopilada:
    {datos_unidos}
    
    E integra los resultados del análisis de sentimiento y hallazgos clave:
    {analisis}
    
    El reporte debe estructurarse en las siguientes secciones:
    - Un título principal impresionante (#)
    - Resumen Ejecutivo / Introducción
    - Hallazgos Clave de la Investigación
    - Análisis de Sentimiento y Tendencias del Mercado (Usa listas con viñetas `-` o bloques de citas `>`. **PROHIBIDO usar tablas Markdown**, ya que pueden romperse en el diseño responsivo).
    - Conclusiones y Recomendaciones Estratégicas
    - Fuentes y Referencias:
      * EXCLUSIÓN ESTRICTA DE REDES Y WIKIPEDIA: Queda estrictamente PROHIBIDO mencionar o incluir como fuente o referencia redes sociales y plataformas como Facebook, Instagram, TikTok y Wikipedia (así como Twitter/X). NUNCA las menciones ni enlaces en esta sección ni en el cuerpo del reporte.
      * YouTube SÍ está permitido incluirlo únicamente si aparece en la información recopilada de manera relevante.
      * REGLA ESTRICTA DE COPIA LITERAL DE ENLACES: Solo debes citar fuentes de noticias oficiales, portales periodísticos, sitios de investigación o medios especializados. Crea enlaces Markdown [Nombre de la Fuente / Medio](URL_EXACTA) copiando TEXTUALMENTE las URLs que aparecen explícitamente en el campo '**URL:**' de la información recopilada arriba.
      * PROHIBICIÓN ABSOLUTA: No inventes, no deduzcas, no intentes corregir ni generes ninguna URL que no aparezca escrita de forma idéntica en los datos recopilados.
      * Si una fuente no tiene una URL directa en los datos recopilados, cítala EXCLUSIVAMENTE como texto plano (ejemplo: `- Nombre del Artículo o Reporte - Nombre del Medio`) SIN usar corchetes ni crear hipervínculos `[ ]( )`, asegurándote de que NO sea Facebook, Instagram, TikTok ni Wikipedia.
      * No repitas la misma URL varias veces.
    
    REGLAS DE ESTILO EJECUTIVO:
    1. NO incluyas secciones ni párrafos de auto-evaluación de "Veracidad" o credibilidad (ej. no pongas "La información presentada es altamente creíble..."). El informe debe presentarse de manera directa y profesional sin meta-comentarios de IA.
    2. Escribe todo en español, manteniendo un tono formal, objetivo y ejecutivo.
    """
    
    instancia_llm = obtener_llm(clave_gemini)
    respuesta = instancia_llm.invoke([
        SystemMessage(content="Eres un redactor de reportes de investigación."),
        HumanMessage(content=prompt)
    ])
    
    return {
        "reporte_final": respuesta.content,
        "historial_pasos": historial + [paso + " ¡Reporte finalizado!"],
        "agente_actual": "Redactor"
    }

# Definición del flujo LangGraph
flujo = StateGraph(EstadoInvestigacion)
flujo.add_node("investigador", agente_investigador)
flujo.add_node("analista", agente_analista)
flujo.add_node("redactor", agente_redactor)

flujo.set_entry_point("investigador")
flujo.add_edge("investigador", "analista")
flujo.add_edge("analista", "redactor")
flujo.add_edge("redactor", END)

grafo_agentes = flujo.compile()
