document.addEventListener("DOMContentLoaded", () => {
    localStorage.removeItem("tutorial_investigabot_visto");

    lucide.createIcons();

    const temaEntrada = document.getElementById("tema-entrada");
    const btnIniciar = document.getElementById("btn-iniciar");
    const tableroOrquestacion = document.getElementById("tablero-orquestacion");
    const logsContenedor = document.getElementById("logs-contenedor");
    const seccionReporte = document.getElementById("seccion-reporte");
    const reporteMarkdown = document.getElementById("reporte-markdown");
    
    const btnCopiar = document.getElementById("btn-copiar");
    const btnDescargar = document.getElementById("btn-descargar");
    const btnDescargarPdf = document.getElementById("btn-descargar-pdf");
    const chipsSugerencias = document.querySelectorAll(".chip-sugerencia");

    let incluirImagenes = true;
    const btnToggleImg = document.getElementById("btn-toggle-img");
    if (btnToggleImg) {
        btnToggleImg.addEventListener("click", () => {
            incluirImagenes = !incluirImagenes;
            if (incluirImagenes) {
                btnToggleImg.classList.add("activo");
                btnToggleImg.innerHTML = `<i data-lucide="image"></i> <span>Imágenes</span>`;
            } else {
                btnToggleImg.classList.remove("activo");
                btnToggleImg.innerHTML = `<i data-lucide="image-off"></i> <span>Sin Imágenes</span>`;
            }
            lucide.createIcons();
        });
    }

    const tutorialVisto = localStorage.getItem("tutorial_investigabot_visto");
    if (!tutorialVisto) {
        setTimeout(iniciarTour, 500);
    }

    // Tour guiado
    const tourOverlay = document.getElementById("tour-overlay");
    const tourTooltip = document.getElementById("tour-tooltip");
    const btnCerrarTour = document.getElementById("btn-cerrar-tour");
    const btnTourAnterior = document.getElementById("btn-tour-anterior");
    const btnTourSiguiente = document.getElementById("btn-tour-siguiente");
    const tourTitulo = document.getElementById("tour-titulo");
    const tourTexto = document.getElementById("tour-texto");
    const tourPasoBadge = document.getElementById("tour-paso-badge");

    const pasosTour = [
        { id: "btn-config-api", titulo: "API Keys", texto: "Primero, configura tus claves API aquí. Necesitarás claves de Google Gemini y Tavily (ambas son gratuitas)." },
        { id: "tema-entrada", titulo: "Tema de Investigación", texto: "Escribe aquí el tema que deseas investigar. ¡Puede ser cualquier tendencia o mercado!" },
        { id: "grupo-longitud", titulo: "Longitud del Reporte", texto: "Ajusta qué tan extenso deseas que sea tu reporte final." },
        { id: "btn-toggle-img", titulo: "Imágenes Reales", texto: "Activa o desactiva la búsqueda de imágenes web para enriquecer tu reporte." },
        { id: "btn-iniciar", titulo: "¡Iniciar!", texto: "Presiona aquí para que los agentes comiencen a trabajar en tiempo real." }
    ];

    let pasoActual = 0;
    let elementoResaltadoActual = null;

    function iniciarTour() {
        pasoActual = 0;
        tourOverlay.style.display = "block";
        tourOverlay.style.top = "50%";
        tourOverlay.style.left = "50%";
        tourOverlay.style.width = "0px";
        tourOverlay.style.height = "0px";
        setTimeout(() => { tourOverlay.style.opacity = "1"; }, 10);
        tourTooltip.style.display = "flex";
        mostrarPaso(pasoActual);
    }

    function cerrarTour() {
        if (elementoResaltadoActual) {
            elementoResaltadoActual.classList.remove("tour-highlight");
        }
        tourOverlay.style.opacity = "0";
        tourTooltip.classList.remove("visible");
        setTimeout(() => {
            tourOverlay.style.display = "none";
            tourTooltip.style.display = "none";
        }, 300);
        localStorage.setItem("tutorial_investigabot_visto", "true");
        temaEntrada.focus();
    }

    function mostrarPaso(indice) {
        if (elementoResaltadoActual) {
            elementoResaltadoActual.classList.remove("tour-highlight");
        }

        const paso = pasosTour[indice];
        elementoResaltadoActual = document.getElementById(paso.id);

        if (!elementoResaltadoActual) {
            cerrarTour();
            return;
        }

        elementoResaltadoActual.classList.add("tour-highlight");
        elementoResaltadoActual.scrollIntoView({ behavior: "smooth", block: "center" });

        tourTitulo.textContent = paso.titulo;
        tourTexto.textContent = paso.texto;
        tourPasoBadge.textContent = `Paso ${indice + 1}/${pasosTour.length}`;

        btnTourAnterior.disabled = indice === 0;
        if (indice === pasosTour.length - 1) {
            btnTourSiguiente.textContent = "Finalizar";
            btnTourSiguiente.innerHTML = 'Finalizar <i data-lucide="check"></i>';
        } else {
            btnTourSiguiente.textContent = "Siguiente";
        }
        lucide.createIcons();

        setTimeout(() => {
            const rect = elementoResaltadoActual.getBoundingClientRect();
            const padding = 8;
            tourOverlay.style.top = `${rect.top - padding}px`;
            tourOverlay.style.left = `${rect.left - padding}px`;
            tourOverlay.style.width = `${rect.width + padding * 2}px`;
            tourOverlay.style.height = `${rect.height + padding * 2}px`;

            let top = rect.bottom + 15;
            let left = rect.left;

            if (left + 320 > window.innerWidth) {
                left = window.innerWidth - 340;
            }
            if (rect.bottom + 200 > window.innerHeight) {
                top = rect.top - 200;
            }

            tourTooltip.style.top = `${top}px`;
            tourTooltip.style.left = `${left}px`;
            tourTooltip.classList.add("visible");
        }, 300);
    }

    btnTourAnterior.addEventListener("click", () => {
        if (pasoActual > 0) {
            pasoActual--;
            mostrarPaso(pasoActual);
        }
    });

    btnTourSiguiente.addEventListener("click", () => {
        if (pasoActual < pasosTour.length - 1) {
            pasoActual++;
            mostrarPaso(pasoActual);
        } else {
            cerrarTour();
        }
    });

    btnCerrarTour.addEventListener("click", cerrarTour);
    tourOverlay.addEventListener("click", cerrarTour);

    // Modal API Keys
    const modalApi = document.getElementById("modal-api");
    const btnConfigApi = document.getElementById("btn-config-api");
    const btnCerrarModalApi = document.getElementById("btn-cerrar-modal-api");
    const btnGuardarApi = document.getElementById("btn-guardar-api");
    const inputApiKeyLlm = document.getElementById("api-key-llm");
    const inputApiKeySearch = document.getElementById("api-key-search");
    
    // Cargar keys guardadas
    if (inputApiKeyLlm) inputApiKeyLlm.value = localStorage.getItem("api_key_llm") || "";
    if (inputApiKeySearch) inputApiKeySearch.value = localStorage.getItem("api_key_search") || "";

    if (btnConfigApi) {
        btnConfigApi.addEventListener("click", () => {
            modalApi.classList.add("abierto");
        });
    }

    if (btnCerrarModalApi) {
        btnCerrarModalApi.addEventListener("click", () => {
            modalApi.classList.remove("abierto");
        });
    }

    if (btnGuardarApi) {
        btnGuardarApi.addEventListener("click", () => {
            const llmKey = inputApiKeyLlm.value.trim();
            const searchKey = inputApiKeySearch.value.trim();
            
            if (llmKey) localStorage.setItem("api_key_llm", llmKey);
            if (searchKey) localStorage.setItem("api_key_search", searchKey);
            
            alert("Códigos API guardados correctamente en tu navegador.");
            modalApi.classList.remove("abierto");
        });
    }

    // Nodos del grafo
    const nodos = {
        inicio: document.getElementById("nodo-inicio"),
        investigador: document.getElementById("nodo-investigador"),
        analista: document.getElementById("nodo-analista"),
        redactor: document.getElementById("nodo-redactor"),
        fin: document.getElementById("nodo-fin")
    };

    let reporteFinalTexto = "";

    // Restaurar sesión previa si existe
    try {
        const textoGuardado = sessionStorage.getItem("investigabot_reporte_texto");
        const htmlGuardado = sessionStorage.getItem("investigabot_reporte_html");
        const temaGuardado = sessionStorage.getItem("investigabot_tema");

        if (textoGuardado && htmlGuardado) {
            reporteFinalTexto = textoGuardado;
            reporteMarkdown.innerHTML = htmlGuardado;
            if (temaGuardado) temaEntrada.value = temaGuardado;
            seccionReporte.style.display = "flex";

            reporteMarkdown.querySelectorAll("a").forEach(enlace => {
                enlace.setAttribute("target", "_blank");
                enlace.setAttribute("rel", "noopener noreferrer");
            });
        }
    } catch(e) {
        console.warn("No se pudo restaurar la sesión previa:", e);
    }

    // Sugerencias
    chipsSugerencias.forEach(chip => {
        chip.addEventListener("click", () => {
            const texto = chip.dataset.texto;
            temaEntrada.value = texto;
            temaEntrada.focus();
        });
    });

    let longitudSeleccionada = "estándar";
    const botonesLongitud = document.querySelectorAll(".btn-longitud");
    botonesLongitud.forEach(btn => {
        btn.addEventListener("click", () => {
            botonesLongitud.forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");
            longitudSeleccionada = btn.dataset.valor;
        });
    });

    // Iniciar flujo
    btnIniciar.addEventListener("click", async () => {
        const tema = temaEntrada.value.trim();
        const longitud = longitudSeleccionada;
        if (!tema) {
            alert("Por favor, introduce un tema de investigación.");
            return;
        }

        tableroOrquestacion.style.display = "flex";
        seccionReporte.style.display = "none";
        logsContenedor.innerHTML = "";
        reporteFinalTexto = "";
        
        Object.values(nodos).forEach(nodo => {
            nodo.classList.remove("activo", "completado");
        });

        btnIniciar.disabled = true;
        temaEntrada.disabled = true;
        
        agregarLog("sistema", `> Iniciando orquestación LangGraph para el tema: "${tema}"`);
        activarNodo("inicio");

        try {
            const llmKey = localStorage.getItem("api_key_llm") || "";
            const searchKey = localStorage.getItem("api_key_search") || "";

            const response = await fetch("http://localhost:8000/investigar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    tema, 
                    longitud,
                    incluir_imagenes: incluirImagenes,
                    gemini_api_key: llmKey || null,
                    tavily_api_key: searchKey || null
                })
            });

            if (!response.ok) {
                throw new Error("No se pudo establecer conexión con el servidor multi-agente.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lineas = buffer.split("\n\n");
                buffer = lineas.pop();

                for (const linea of lineas) {
                    if (linea.startsWith("data: ")) {
                        const datos = JSON.parse(linea.substring(6));
                        procesarEvento(datos);
                    }
                }
            }

        } catch (error) {
            agregarLog("error", `> Error de ejecución: ${error.message}`);
            btnIniciar.disabled = false;
            temaEntrada.disabled = false;
        }
    });

    // Eventos SSE
    function procesarEvento(datos) {
        const { evento, agente, mensaje, salida, reporte_final } = datos;

        if (evento === "inicio") {
            completarNodo("inicio");
            activarNodo("investigador");
            agregarLog("sistema", `[${agente}] ${mensaje}`);
            mostrarCargando("Los agentes están trabajando...");
        } 
        else if (evento === "progreso") {
            const idNodo = agente.toLowerCase();
            completarNodo(idNodo);
            agregarLog("agente", `[Agente ${agente}] > ${mensaje}`);

            if (idNodo === "investigador") {
                activarNodo("analista");
                if (salida && salida.datos_recopilados) {
                    agregarLog("salida", `Analizando múltiples fuentes y artículos web recopilados...`);
                }
            } 
            else if (idNodo === "analista") {
                activarNodo("redactor");
                if (salida && salida.analisis) {
                    agregarLog("salida", `Sentimiento calculado: ${salida.analisis.sentimiento || 'Positivo/Neutro'}`);
                }
            } 
            else if (idNodo === "redactor") {
                activarNodo("fin");
            }
        } 
        else if (evento === "fin") {
            ocultarCargando();
            completarNodo("fin");
            agregarLog("exito", `[${agente}] ¡Proceso completado! ${mensaje}`);
            
            if (reporte_final) {
                reporteFinalTexto = reporte_final;
                try {
                    reporteMarkdown.innerHTML = marked.parse ? marked.parse(reporte_final) : marked(reporte_final);

                    reporteMarkdown.querySelectorAll("a").forEach(enlace => {
                        enlace.setAttribute("target", "_blank");
                        enlace.setAttribute("rel", "noopener noreferrer");
                    });

                    reporteMarkdown.querySelectorAll("img").forEach(img => {
                        img.setAttribute("referrerpolicy", "no-referrer");
                        img.setAttribute("loading", "lazy");

                        const recuperarImagen = () => {
                            if (!img.dataset.reintentado) {
                                img.dataset.reintentado = "true";
                                const tema = (temaEntrada.value || "").trim() || "noticias investigacion";
                                const descripcion = (img.alt || tema).replace(/["']/g, "");
                                const promptContextual = encodeURIComponent(`${descripcion} editorial photojournalism ultra hd`);
                                // Fallback contextual
                                img.src = `https://image.pollinations.ai/prompt/${promptContextual}?width=1200&height=630&nologo=true`;
                            } else {
                                const parrafoPadre = img.closest("p");
                                const siguienteElem = img.nextElementSibling || (parrafoPadre ? parrafoPadre.nextElementSibling : null);
                                if (siguienteElem && (siguienteElem.tagName === "EM" || siguienteElem.querySelector("em"))) {
                                    siguienteElem.remove();
                                }
                                img.remove();
                                if (parrafoPadre && !parrafoPadre.textContent.trim() && parrafoPadre.children.length === 0) {
                                    parrafoPadre.remove();
                                }
                            }
                        };

                        if (img.complete && img.naturalWidth === 0) {
                            recuperarImagen();
                        } else {
                            img.onerror = recuperarImagen;
                        }
                    });

                    // Guardar reporte en sesión
                    sessionStorage.setItem("investigabot_reporte_texto", reporte_final);
                    sessionStorage.setItem("investigabot_reporte_html", reporteMarkdown.innerHTML);
                    sessionStorage.setItem("investigabot_tema", temaEntrada.value || "");

                } catch(e) {
                    reporteMarkdown.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${reporte_final}</pre>`;
                }
                seccionReporte.style.display = "flex";
                seccionReporte.scrollIntoView({ behavior: "smooth" });
            }

            btnIniciar.disabled = false;
            temaEntrada.disabled = false;
        } 
        else if (evento === "error") {
            ocultarCargando();
            agregarLog("error", `> ERROR: ${datos.mensaje}`);
            btnIniciar.disabled = false;
            temaEntrada.disabled = false;
        }
    }

    // Loader
    let loaderElemento = null;

    function mostrarCargando(texto) {
        if (loaderElemento) return;
        loaderElemento = document.createElement("div");
        loaderElemento.className = "log-cargando";
        loaderElemento.innerHTML = `
            ${texto}
            <div class="dots"><span></span><span></span><span></span></div>
        `;
        logsContenedor.appendChild(loaderElemento);
        logsContenedor.scrollTop = logsContenedor.scrollHeight;
    }

    function ocultarCargando() {
        if (loaderElemento && loaderElemento.parentNode) {
            loaderElemento.parentNode.removeChild(loaderElemento);
            loaderElemento = null;
        }
    }

    // Helpers del grafo
    function activarNodo(id) {
        if (nodos[id]) {
            nodos[id].classList.add("activo");
        }
    }

    function completarNodo(id) {
        if (nodos[id]) {
            nodos[id].classList.remove("activo");
            nodos[id].classList.add("completado");
        }
    }

    function agregarLog(tipo, texto) {
        const elemento = document.createElement("div");
        elemento.className = `log-linea ${tipo}`;
        elemento.textContent = texto;
        logsContenedor.appendChild(elemento);
        logsContenedor.scrollTop = logsContenedor.scrollHeight;
    }

    // Copiar Markdown
    btnCopiar.addEventListener("click", () => {
        navigator.clipboard.writeText(reporteFinalTexto).then(() => {
            const originalText = btnCopiar.innerHTML;
            btnCopiar.innerHTML = `<i data-lucide="check"></i> ¡Copiado!`;
            lucide.createIcons();
            setTimeout(() => {
                btnCopiar.innerHTML = originalText;
                lucide.createIcons();
            }, 2000);
        });
    });

    // Exportar PDF
    if (btnDescargarPdf) {
        btnDescargarPdf.addEventListener("click", async () => {
            if (!reporteFinalTexto || !reporteMarkdown.innerHTML.trim()) {
                alert("Por favor genera un reporte primero antes de descargarlo en PDF.");
                return;
            }

            const fechaHoy = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

            const textoOriginalBoton = btnDescargarPdf.innerHTML;
            btnDescargarPdf.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Preparando imágenes...`;
            btnDescargarPdf.disabled = true;

            const clonReporte = document.createElement("div");
            clonReporte.innerHTML = reporteMarkdown.innerHTML;

            const imagenesOriginales = reporteMarkdown.querySelectorAll("img");
            const imagenesClon = clonReporte.querySelectorAll("img");
            
            // Incrustar imágenes como Base64 para el PDF
            const incrustarImagen = async (imgClon, index) => {
                const imgOrig = imagenesOriginales[index] || imgClon;
                const urlOriginal = imgOrig.src || imgClon.src;

                if (!urlOriginal || urlOriginal.startsWith("data:image")) {
                    return;
                }

                // 1. Canvas directo
                try {
                    if (imgOrig.complete && imgOrig.naturalWidth > 0) {
                        const canvas = document.createElement("canvas");
                        canvas.width = imgOrig.naturalWidth;
                        canvas.height = imgOrig.naturalHeight;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(imgOrig, 0, 0);
                        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                        if (dataUrl && dataUrl.startsWith("data:image")) {
                            imgClon.src = dataUrl;
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Canvas bloqueado por CORS local, usando backend proxy:", e);
                }

                // 2. Proxy backend
                try {
                    const host = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
                        ? `http://${window.location.hostname}:8000` 
                        : "http://localhost:8000";
                    const res = await fetch(`${host}/proxy-imagen?url=${encodeURIComponent(urlOriginal)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.data_url) {
                            imgClon.src = data.data_url;
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Error en proxy de imagen para PDF:", e);
                }

                // 3. Fetch blob directo
                try {
                    const res = await fetch(urlOriginal, { mode: 'cors' });
                    const blob = await res.blob();
                    const reader = new FileReader();
                    await new Promise((resolve) => {
                        reader.onloadend = () => {
                            if (reader.result && reader.result.startsWith("data:image")) {
                                imgClon.src = reader.result;
                            }
                            resolve();
                        };
                        reader.onerror = resolve;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.warn("Fallo último recurso fetch blob:", e);
                }
            };

            await Promise.all(Array.from(imagenesClon).map((img, idx) => incrustarImagen(img, idx)));

            btnDescargarPdf.innerHTML = textoOriginalBoton;
            btnDescargarPdf.disabled = false;
            if (window.lucide) lucide.createIcons();

            // Iframe temporal de impresión
            const iframeImpresion = document.createElement("iframe");
            iframeImpresion.style.position = "fixed";
            iframeImpresion.style.right = "0";
            iframeImpresion.style.bottom = "0";
            iframeImpresion.style.width = "0";
            iframeImpresion.style.height = "0";
            iframeImpresion.style.border = "0";
            document.body.appendChild(iframeImpresion);

            const doc = iframeImpresion.contentWindow.document;
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title></title>
                    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }
                        * {
                            box-sizing: border-box;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        html, body {
                            background: #ffffff;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            color: #1e293b;
                            line-height: 1.65;
                            font-size: 10pt;
                        }
                        .tabla-documento-impresion {
                            width: 100%;
                            border-collapse: collapse;
                            border: none;
                        }
                        .espaciador-pagina-superior {
                            height: 18mm;
                            padding: 0;
                            border: none;
                        }
                        .espaciador-pagina-inferior {
                            height: 18mm;
                            padding: 0;
                            border: none;
                        }
                        .celda-cuerpo-impresion {
                            padding: 0 16mm;
                            border: none;
                            vertical-align: top;
                        }
                        h1 {
                            font-size: 17.5pt;
                            font-weight: 800;
                            color: #0f172a;
                            margin: 0 0 16px 0;
                            line-height: 1.25;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        h2 {
                            font-size: 13pt;
                            font-weight: 700;
                            color: #1e293b;
                            margin: 22px 0 10px 0;
                            padding-bottom: 4px;
                            border-bottom: 1.5px solid #e2e8f0;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        h3 {
                            font-size: 11pt;
                            font-weight: 600;
                            color: #334155;
                            margin: 16px 0 8px 0;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        p {
                            margin: 0 0 12px 0;
                            color: #334155;
                            text-align: justify;
                            orphans: 3;
                            widows: 3;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        ul, ol {
                            margin: 0 0 14px 0;
                            padding-left: 22px;
                            color: #334155;
                        }
                        li {
                            margin-bottom: 8px;
                            line-height: 1.55;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        strong {
                            color: #0f172a;
                            font-weight: 700;
                        }
                        blockquote {
                            background: #f8fafc;
                            border-left: 3.5px solid #6366f1;
                            padding: 10px 14px;
                            margin: 14px 0;
                            font-size: 9.5pt;
                            color: #475569;
                            border-radius: 0 6px 6px 0;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        img {
                            max-width: 100%;
                            max-height: 280px;
                            object-fit: cover;
                            border-radius: 8px;
                            margin: 14px auto 4px auto;
                            display: block;
                            page-break-inside: avoid;
                            break-inside: avoid;
                            border: 1px solid #e2e8f0;
                        }
                        em {
                            font-size: 8pt;
                            color: #64748b;
                            display: block;
                            text-align: center;
                            margin-bottom: 16px;
                            page-break-before: avoid;
                            break-before: avoid;
                        }
                        a {
                            color: #4f46e5;
                            text-decoration: underline;
                            word-break: break-all;
                        }
                    </style>
                </head>
                <body>
                    <table class="tabla-documento-impresion">
                        <thead>
                            <tr>
                                <td class="espaciador-pagina-superior"></td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="celda-cuerpo-impresion">
                                    ${clonReporte.innerHTML}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td class="espaciador-pagina-inferior"></td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
                </html>
            `);
            doc.close();

            const imgsIframe = doc.querySelectorAll("img");
            const promesas = Array.from(imgsIframe).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    setTimeout(resolve, 1500);
                });
            });

            await Promise.all(promesas);

            setTimeout(() => {
                iframeImpresion.contentWindow.focus();
                iframeImpresion.contentWindow.print();
                setTimeout(() => {
                    if (document.body.contains(iframeImpresion)) {
                        document.body.removeChild(iframeImpresion);
                    }
                }, 3000);
            }, 300);
        });
    }

    // Descargar .md
    btnDescargar.addEventListener("click", () => {
        if (!reporteFinalTexto) return;
        const blob = new Blob([reporteFinalTexto], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const nombreArchivo = temaEntrada.value.trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() + "_reporte.md";
        a.download = nombreArchivo || "reporte_investigacion.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
