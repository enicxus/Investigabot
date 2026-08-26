# InvestigaBot: Sistema Multi-Agente de Investigación

Sistema de investigación autónomo basado en agentes inteligentes coordinados con **LangGraph**, **FastAPI** y **Google Gemini**.

El sistema orquesta tres agentes especializados que colaboran de manera secuencial para recopilar información, analizar tendencias y generar un reporte completo en Markdown/PDF.

---

## Arquitectura y Puertos

El proyecto funciona con una arquitectura cliente-servidor:

| Componente | Tecnología | Dirección / Puerto por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| **Backend API** | FastAPI + Uvicorn + LangGraph | `http://localhost:8000` | Endpoints REST y streaming SSE para transmisión en tiempo real. |
| **Frontend Web** | Vanilla HTML / CSS / JS | `http://localhost:3000` / `5500` o `index.html` | Interfaz web para visualizar el flujo del grafo y el reporte generado. |

- **Framework de Agentes**: LangGraph (máquina de estados).
- **Modelo de IA**: Google Gemini (`gemini-2.5-flash`) mediante LangChain.
- **Backend**: FastAPI con Server-Sent Events (SSE).
- **Frontend**: HTML5, CSS3 y JavaScript con visualización interactiva del grafo y exportación a PDF/Markdown.

---
## El Equipo de Agentes
1. **Agente Investigador (`agente_investigador`)**: Realiza búsquedas de información, fuentes y recopila imágenes web sobre el tema solicitado (vía Tavily Search API o simulador inteligente con Gemini).
2. **Agente Analista (`agente_analista`)**: Valida la consistencia de los datos recopilados, estima el sentimiento del mercado (positivo/negativo/neutro) y extrae las métricas clave.
3. **Agente Redactor (`agente_redactor`)**: Toma la información agregada, el análisis y las imágenes para redactar un reporte completo estructurado en Markdown listo para descargar en PDF o .md.

---

## Guía de Instalación y Uso

### Requisitos Previos
- Python 3.10 o superior instalado.
- Una clave de API de Google Gemini (puedes obtenerla gratis en [Google AI Studio](https://aistudio.google.com/)).
- *(Opcional)* Clave de API de [Tavily Search](https://tavily.com/) para búsquedas web en vivo.

---

### 1. Clonar el Repositorio e Instalar Dependencias

Navega a la carpeta del backend e instala los requerimientos (se recomienda usar un entorno virtual):

```bash
# Navegar a la carpeta backend
cd backend

# (Opcional pero recomendado) Crear y activar entorno virtual
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

---

### 2. Configurar Variables de Entorno

Para que el sistema funcione, necesitas un archivo llamado **`.env`** (con el punto al principio) dentro de la carpeta `backend/`.

Puedes crearlo copiando o renombrando la plantilla existente:

**Por comando (Terminal / Bash / PowerShell):**
```bash
# En Windows (PowerShell):
Copy-Item .env.example .env

# En Linux / macOS / Git Bash:
cp .env.example .env
```

**O de forma manual:**
Haz una copia o renombra el archivo `backend/.env.example` a **`backend/.env`**.

---

Abre el archivo **`.env`** que acabas de crear y coloca tus claves API:
```env
GEMINI_API_KEY=tu_clave_de_gemini_aqui
TAVILY_API_KEY=tu_clave_de_tavily_aqui
```

> ⚠️ **Nota de Seguridad**: El archivo `.gitignore` ya está configurado para que tu archivo `.env` real **nunca se suba a GitHub**, manteniendo tus claves 100% privadas.
> Si no posees clave API de Tavily, no te preocupes: el agente investigador utilizará automáticamente su simulador interno inteligente para completar la búsqueda web sin interrumpir el flujo.

---

### 3. Iniciar el Servidor Backend (Puerto 8000)

Desde la carpeta `backend`, ejecuta el servidor FastAPI con Uvicorn:

```bash
python servidor.py
```
O bien:
```bash
uvicorn servidor:app --host 0.0.0.0 --port 8000 --reload
```

El servidor estará escuchando en: **`http://localhost:8000`**.

---

### 4. Iniciar el Frontend (Puerto 3000 / 5500)

Tienes dos opciones para abrir la interfaz web:

#### Opción A: Con un servidor HTTP local (Recomendado)
Desde la raíz del proyecto (donde está `index.html`):
```bash
# Usando Python (Puerto 3000):
python -m http.server 3000
```
Luego abre en tu navegador: **`http://localhost:3000`**

*(También puedes usar la extensión **Live Server** de VS Code, que normalmente corre en `http://localhost:5500`).*

#### Opción B: Abrir directamente el archivo
Haz doble clic sobre el archivo `index.html` en el explorador de archivos para abrirlo en tu navegador.

---

### 5. Probar el Sistema
1. Escribe un tema de interés en el cuadro de búsqueda (ej. *El futuro de la fusión nuclear y la energía limpia en 2026*).
2. Pulsa **"Iniciar Investigación"**.
3. Observa la orquestación en vivo del grafo de agentes de IA y revisa el reporte final generado en Markdown.

---

## Autor

Desarrollado por **[enicxus](https://github.com/enicxus)** como proyecto de Inteligencia Artificial y Sistemas Multi-Agente.

