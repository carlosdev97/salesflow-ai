let API_KEY = "";
let CUSTOM_PROMPT = "";
let PRICE_1 = "";
let PRICE_2 = "";
let PRICE_3 = "";
let PRODUCT_NAME = "";
let DROPI_URL = "";

const MESSAGES = {
  WELCOME: () => `La *Cinta Aislante Líquida* te ofrece:

✅ Aislamiento eléctrico seguro
✅ Impermeabilidad total
✅ Recubrimiento flexible y duradero
✅ Fácil aplicación
✅ Resistencia al calor y condiciones extremas

¿Te gustaría saber cómo funciona? 🛠️`,

  PRICES: () => `🔥 *Ofertas especiales* 🔥

1️⃣ Unidad – *${PRICE_1}*
2️⃣ Unidades – *${PRICE_2}* (Más vendido)
3️⃣ Unidades – *${PRICE_3}* (Más ahorro)

🚚 Envío totalmente *GRATIS*.
💳 Puedes pagar *al recibir* o por transferencia bancaria.

¿Cuantos deseas ordenar antes de que se agoten? 😊`,

  DATA_REQUEST: () => `Para agendar tu envío, por favor comparteme:

✅ *Nombres*
✅ *Apellidos*
✅ *Celular*
✅ *Dirección exacta* como aparece en tu recibo público o si reclamas en oficina escribe en este campo *Oficina* 📍
✅ *Barrio* 
✅ *Ciudad* 
✅ *Departamento*
✅ *Número de unidades a ordenar*

¿Me ayudas con los datos y dejamos tu envío asegurado ya mismo? 🙌`,

  CONFIRMATION: () => `✅ *¡Tu pedido está confirmado!* 🛍

Has confirmado tu orden de *Cinta Aislante Líquida*.

🚚 *Tiempo de entrega:* 4 a 5 días hábiles
📦 *Seguimiento:* Te enviaremos el número de guía apenas esté disponible
📲 *Estado del pedido:* Te mantendremos informado en todo momento

✨ Gracias por confiar en *Offerti*

Si tienes alguna duda, no dudes en escribirnos 😊
`
};


//  Inyección de archivos

function dataURLtoFile(dataurl, filename) {
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime, lastModified: Date.now() });
}

function injectFiles(fileDataArray) {
  const chatElement =
    document.querySelector('[data-tab="6"]') ||
    document.querySelector('[role="application"]') ||
    document.querySelector("#main");
  if (!chatElement) return;

  const dataTransfer = new DataTransfer();
  fileDataArray.forEach(({ data, name }) =>
    dataTransfer.items.add(dataURLtoFile(data, name)),
  );

  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: dataTransfer,
  });

  const targetElement =
    (document.activeElement?.isContentEditable
      ? document.activeElement
      : null) ||
    document.querySelector('footer div[contenteditable="true"]') ||
    chatElement;

  targetElement.dispatchEvent(pasteEvent);
}

function waitAndClickSendModal() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 120;
    const interval = setInterval(() => {
      attempts++;
      const sendButton =
        document.querySelector('[data-icon="send"]') ||
        document.querySelector('[data-icon="wds-ic-send-filled"]') ||
        document.querySelector('[data-testid="send"]') ||
        document.querySelector('div[role="button"][aria-label^="Enviar"]') ||
        document.querySelector('div[role="button"][aria-label^="Send"]');

      if (sendButton) {
        const isVisible = sendButton.offsetParent !== null;
        const isDisabled = sendButton.getAttribute("aria-disabled") === "true";
        if (isVisible && !isDisabled) {
          clearInterval(interval);
          const clickable =
            sendButton.closest('[role="button"]') ||
            sendButton.parentElement ||
            sendButton;
          setTimeout(() => {
            clickable.click();
            resolve(true);
          }, 500);
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

function isChatOpen() {
  return !!(
    document.querySelector('[data-tab="6"]') ||
    document.querySelector('[role="application"]') ||
    document.querySelector("#main")
  );
}

//  Helpers

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

//  Ventana flotante

window.addEventListener("load", () => {
  // 3 slots de archivos independientes
  const mediaSlots = [[], [], []];

  // ── Estilos ──────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    #salesflow-ai {
      position: fixed;
      top: 0px; left: 277px;
      width: 272px;
      background: #0e0e12;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.07);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.8);
      font-family: 'Inter', system-ui, sans-serif;
      color: #e8e8f0;
      z-index: 99999;
      cursor: grab;
      user-select: none;
      overflow: hidden;
      transition: height 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    #salesflow-ai:active { cursor: grabbing; }
    #salesflow-ai.minimized #salesflow-ai-body { display: none; }

    /* ── Header ── */
    #salesflow-ai-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 11px 13px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }
    #salesflow-ai-header .ri-icon {
      font-size: 16px; line-height: 1;
    }
    #salesflow-ai-header .ri-title {
      font-size: 12.5px; font-weight: 700;
      letter-spacing: -0.02em; color: #f0f0f8;
      flex: 1;
    }
    #salesflow-ai-header .ri-title span {
      font-weight: 400; color: rgba(255,255,255,0.3); font-size: 11px;
    }

    /* Status dot */
    #ri-status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 6px rgba(239,68,68,0.7);
      flex-shrink: 0;
      transition: background 0.4s, box-shadow 0.4s;
    }
    #ri-status-dot.online {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34,197,94,0.8);
      animation: ri-pulse 2.5s ease-in-out infinite;
    }
    @keyframes ri-pulse {
      0%,100% { box-shadow: 0 0 8px 2px rgba(34,197,94,0.7); }
      50%      { box-shadow: 0 0 2px 0px rgba(34,197,94,0.1); }
    }

    /* Minimizar */
    #ri-minimize-btn {
      width: 22px; height: 22px; border-radius: 6px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.4);
      font-size: 13px; line-height: 1;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    #ri-minimize-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

    /* ── Body ── */
    #salesflow-ai-body { padding: 0 0 12px; }

    /* ── Tabs ── */
    #ri-tabs {
      display: flex;
      padding: 10px 12px 0;
      gap: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .ri-tab {
      flex: 1;
      padding: 7px 4px;
      font-size: 11px; font-weight: 600;
      color: rgba(255,255,255,0.3);
      text-align: center;
      cursor: pointer;
      border-radius: 7px 7px 0 0;
      border: 1px solid transparent;
      border-bottom: none;
      transition: color 0.2s, background 0.2s;
      letter-spacing: -0.01em;
      position: relative;
      bottom: -1px;
    }
    .ri-tab:hover { color: rgba(255,255,255,0.6); }
    .ri-tab.active {
      color: #e8e8f0;
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.07);
      border-bottom-color: #0e0e12;
    }

    /* ── Tab panels ── */
    .ri-panel { display: none; padding: 13px 12px 0; }
    .ri-panel.active { display: flex; flex-direction: column; gap: 7px; }

    /* ── Textarea ── */
    #ri-audio-wrap .ri-label {
      font-size: 10px; font-weight: 500;
      color: rgba(255,255,255,0.3);
      margin-bottom: 5px; letter-spacing: 0.03em; text-transform: uppercase;
    }
    #ri-audio-input {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 9px; color: #e8e8f0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px; line-height: 1.5;
      padding: 8px 10px; resize: none; outline: none; min-height: 58px;
      transition: border-color 0.2s, background 0.2s;
      cursor: text;
    }
    #ri-audio-input::placeholder { color: rgba(255,255,255,0.18); font-size: 12px; font-family: 'Inter', system-ui, sans-serif; }
    #ri-audio-input:focus { border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.05); }
    #ri-audio-input.has-content { border-color: rgba(139,92,246,0.35); background: rgba(139,92,246,0.06); }

    /* ── Botones generales ── */
    .ri-btn {
      border: none; border-radius: 9px;
      padding: 10px 14px; font-size: 12.5px; font-weight: 600;
      font-family: 'Inter', system-ui, sans-serif;
      cursor: pointer; width: 100%; letter-spacing: -0.01em;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: transform 0.1s, box-shadow 0.2s, opacity 0.2s;
      position: relative; overflow: hidden; color: #fff;
    }
    .ri-btn:active { transform: scale(0.98); }

    /* IA */
    #ri-generate-btn {
      background: transparent;
      box-shadow: 0 2px 10px rgba(100,80,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
    }
    #ri-generate-btn::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4, #a855f7, #6366f1);
      background-size: 300% 100%;
      animation: ri-sweep 4s linear infinite; z-index: 0;
    }
    @keyframes ri-sweep { 0% { background-position:0% 50%; } 100% { background-position:300% 50%; } }
    #ri-generate-btn .ri-btn-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; }
    #ri-generate-btn:hover { box-shadow: 0 5px 18px rgba(100,80,255,0.5), inset 0 1px 0 rgba(255,255,255,0.18); transform: translateY(-1px); }
    #ri-generate-btn.loading { opacity: 0.7; pointer-events: none; }
    #ri-generate-btn.loading .ri-btn-icon { animation: ri-spin 0.8s linear infinite; display: inline-block; }
    @keyframes ri-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Bienvenida */
    #ri-welcome-btn { background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.25); }
    #ri-welcome-btn:hover { background: rgba(255,107,107,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,107,107,0.18); }

    /* Precios */
    #ri-precios-btn { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25); }
    #ri-precios-btn:hover { background: rgba(251,191,36,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(251,191,36,0.18); }

    /* Datos */
    #ri-datos-btn { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); }
    #ri-datos-btn:hover { background: rgba(34,197,94,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.18); }

    /* Enviar media */
    .ri-send-btn {
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.25);
      opacity: 0.4; pointer-events: none;
    }
    .ri-send-btn.ready { opacity: 1; pointer-events: auto; }
    .ri-send-btn.ready:hover { background: rgba(99,102,241,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.2); }

    /* Dropi */
    #ri-dropi-btn { background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.25); }
    #ri-dropi-btn:hover { background: rgba(249,115,22,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(249,115,22,0.18); }

    /* Confirmar pedido */
    #ri-confirmar-btn { background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.25); }
    #ri-confirmar-btn:hover { background: rgba(168,85,247,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168,85,247,0.18); }

    /* ── Media slots ── */
    .ri-media-slot {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 9px 10px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .ri-slot-header {
      display: flex; align-items: center; justify-content: space-between;
    }
    .ri-slot-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
      text-transform: uppercase; color: rgba(255,255,255,0.3);
    }
    .ri-slot-count {
      font-size: 10px; color: rgba(255,255,255,0.25);
    }
    .ri-slot-count.has-files { color: #818cf8; }

    .ri-drop-zone {
      background: rgba(255,255,255,0.03);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 7px;
      padding: 8px 10px;
      font-size: 11px; color: rgba(255,255,255,0.28);
      text-align: center; cursor: pointer;
      transition: border-color 0.2s, background 0.2s, color 0.2s;
    }
    .ri-drop-zone:hover, .ri-drop-zone.drag-over {
      border-color: rgba(129,140,248,0.4);
      background: rgba(129,140,248,0.06);
      color: rgba(255,255,255,0.55);
    }

    .ri-file-list { display: flex; flex-direction: column; gap: 3px; }
    .ri-file-item {
      display: flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.04);
      border-radius: 6px; padding: 4px 7px;
      font-size: 10.5px; color: rgba(255,255,255,0.5);
    }
    .ri-file-item .ri-fname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ri-file-item .ri-fremove {
      cursor: pointer; color: rgba(255,255,255,0.2); font-size: 12px;
      flex-shrink: 0; transition: color 0.15s; line-height: 1;
    }
    .ri-file-item .ri-fremove:hover { color: rgba(239,68,68,0.8); }

    /* ── Dropi & Config panel ── */
    .ri-label {
      font-size: 10px; font-weight: 500;
      color: rgba(255,255,255,0.3);
      margin-bottom: 5px; letter-spacing: 0.03em; text-transform: uppercase;
    }
    #salesflow-ai .ri-input-text, #salesflow-ai .ri-input-textarea {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 9px; color: #e8e8f0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px; line-height: 1.5; padding: 8px 10px; outline: none;
      transition: border-color 0.2s;
      cursor: text;
    }
    #salesflow-ai .ri-input-textarea { resize: none; }
    #salesflow-ai .ri-input-text::placeholder, #salesflow-ai .ri-input-textarea::placeholder { color: rgba(255,255,255,0.18); font-size: 12px; font-family: 'Inter', system-ui, sans-serif; font-weight: 400; }
    #salesflow-ai .ri-input-text:focus, #salesflow-ai .ri-input-textarea:focus { border-color: rgba(249,115,22,0.45); }

    #ri-config-save-btn { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25);}
    #ri-config-save-btn:hover { background: rgba(34,197,94,0.22); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.18);}
    `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────
  const win = document.createElement("div");
  win.id = "salesflow-ai";
  win.innerHTML = `
    <div id="salesflow-ai-header">
      <span class="ri-icon">⚡</span>
      <span class="ri-title">SalesFlow AI <span>· Asistente</span></span>
      <div id="ri-status-dot" title="Estado del chat"></div>
      <button id="ri-minimize-btn" title="Minimizar">−</button>
    </div>

    <div id="salesflow-ai-body">
      <!-- TABS -->
      <div id="ri-tabs">
        <div class="ri-tab active" data-tab="ia">🤖 IA</div>
        <div class="ri-tab" data-tab="media">🖼️ Media</div>
        <div class="ri-tab" data-tab="dropi">⚙️ Config</div>
      </div>

      <!-- PANEL 1: IA -->
      <div class="ri-panel active" id="ri-panel-ia">
        <div id="ri-audio-wrap">
          <div class="ri-label">🎙️ Transcripción de audio</div>
          <textarea id="ri-audio-input" placeholder="Escribe lo que dijo el cliente..."></textarea>
        </div>
        <button id="ri-generate-btn" class="ri-btn">
          <div class="ri-btn-inner">
            <span class="ri-btn-icon">✨</span>
            <span class="ri-btn-label">Generar respuesta con IA</span>
          </div>
        </button>
        <button id="ri-welcome-btn" class="ri-btn">
          <span>1. Bienvenida</span><span>🧡</span>
        </button>
        <button id="ri-precios-btn" class="ri-btn">
          <span>2. Enviar precios</span><span>💰</span>
        </button>
        <button id="ri-datos-btn" class="ri-btn">
          <span>3. Pedir datos</span><span>📋</span>
        </button>
        <button id="ri-confirmar-btn" class="ri-btn">
          <span>4. Confirmar pedido</span><span>✅</span>
        </button>
      </div>

      <!-- PANEL 2: MEDIA (3 slots) -->
      <div class="ri-panel" id="ri-panel-media">
        ${[1, 2, 3]
      .map(
        (n) => `
        <div class="ri-media-slot" id="ri-slot-${n}">
          <div class="ri-slot-header">
            <span class="ri-slot-label">Slot ${n}</span>
            <span class="ri-slot-count" id="ri-slot-count-${n}">sin archivos</span>
          </div>
          <input type="file" id="ri-input-${n}" multiple accept="image/*,video/*" style="display:none">
          <div class="ri-drop-zone" id="ri-drop-${n}">＋ Seleccionar / soltar archivos</div>
          <div class="ri-file-list" id="ri-flist-${n}"></div>
          <button class="ri-btn ri-send-btn" id="ri-send-${n}">
            <span>📤</span><span class="ri-send-label">Enviar al chat actual</span>
          </button>
        </div>`,
      )
      .join("")}
      </div>

      <!-- PANEL 3: DROPI & CONFIG -->
      <div class="ri-panel" id="ri-panel-dropi">
        <div id="ri-config-wrap" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 6px;">
          <div>
            <div class="ri-label">🔑 API Key</div>
            <input type="text" id="ri-config-apikey" class="ri-input-text" placeholder="gsk_..." />
          </div>
          <div>
            <div class="ri-label">📦 Nombre del producto</div>
            <input type="text" id="ri-config-product-name" class="ri-input-text" placeholder="Nombre para confirmación..." />
          </div>
          <div>
            <div class="ri-label">📝 Prompt</div>
            <textarea id="ri-config-prompt" class="ri-input-textarea" placeholder="Escribe el prompt..." style="min-height: 80px;"></textarea>
          </div>
          <div style="display: flex; gap: 4px;">
            <div style="flex:1;">
              <div class="ri-label">Precio 1</div>
              <input type="text" id="ri-config-price1" class="ri-input-text" placeholder="$79.900" />
            </div>
            <div style="flex:1;">
              <div class="ri-label">Precio 2</div>
              <input type="text" id="ri-config-price2" class="ri-input-text" placeholder="$104.900" />
            </div>
            <div style="flex:1;">
              <div class="ri-label">Precio 3</div>
              <input type="text" id="ri-config-price3" class="ri-input-text" placeholder="$124.900" />
            </div>
          </div>
        </div>

        <div id="ri-dropi-input-wrap" style="margin-bottom: 8px;">
          <div class="ri-label">🔗 Enlace del producto en Dropi</div>
          <input type="text" id="ri-dropi-url" class="ri-input-text" placeholder="https://dropi.co/productos/...">
        </div>
        <button id="ri-dropi-btn" class="ri-btn">
          <span>🚀</span><span>Enviar a cliente</span>
        </button>

        <button id="ri-config-save-btn" class="ri-btn">
          <span>💾</span><span>Guardar Configuración</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(win);

  // ── MINIMIZAR ─────────────────────────────────────────────
  const minimizeBtn = document.getElementById("ri-minimize-btn");
  minimizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    win.classList.toggle("minimized");
    minimizeBtn.textContent = win.classList.contains("minimized") ? "+" : "−";
  });

  // ── ESTADO DEL CHAT (dot) ─────────────────────────────────
  const statusDot = document.getElementById("ri-status-dot");

  function updateChatStatus() {
    const active = isChatOpen();
    statusDot.classList.toggle("online", active);
    statusDot.title = active ? "Chat activo" : "Sin chat activo";
  }

  updateChatStatus();
  setInterval(updateChatStatus, 1500);

  // ── TABS ──────────────────────────────────────────────────
  document.querySelectorAll(".ri-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.stopPropagation();
      document
        .querySelectorAll(".ri-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".ri-panel")
        .forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document
        .getElementById(`ri-panel-${tab.dataset.tab}`)
        .classList.add("active");
    });
  });

  // ── ARRASTRABLE ───────────────────────────────────────────
  (function () {
    let dragging = false,
      ox = 0,
      oy = 0,
      cx = 0,
      cy = 0;
    win.addEventListener("mousedown", (e) => {
      if (
        e.target.closest(
          "button, textarea, input, .ri-drop-zone, .ri-file-list, .ri-tab",
        )
      )
        return;
      dragging = true;
      const r = win.getBoundingClientRect();
      cx = r.left;
      cy = r.top;
      ox = e.clientX;
      oy = e.clientY;
      win.style.right = "auto";
      win.style.left = cx + "px";
      win.style.top = cy + "px";
      win.style.transition = "none";
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const maxX = window.innerWidth - win.offsetWidth;
      const maxY = window.innerHeight - win.offsetHeight;
      win.style.left = Math.max(0, Math.min(cx + e.clientX - ox, maxX)) + "px";
      win.style.top = Math.max(0, Math.min(cy + e.clientY - oy, maxY)) + "px";
    });
    document.addEventListener("mouseup", () => {
      dragging = false;
    });
    win.addEventListener(
      "touchstart",
      (e) => {
        if (
          e.target.closest(
            "button, textarea, input, .ri-drop-zone, .ri-file-list, .ri-tab",
          )
        )
          return;
        const t = e.touches[0];
        const r = win.getBoundingClientRect();
        cx = r.left;
        cy = r.top;
        ox = t.clientX;
        oy = t.clientY;
        dragging = true;
        win.style.right = "auto";
        win.style.left = cx + "px";
        win.style.top = cy + "px";
        win.style.transition = "none";
      },
      { passive: true },
    );
    document.addEventListener(
      "touchmove",
      (e) => {
        if (!dragging) return;
        const t = e.touches[0];
        const maxX = window.innerWidth - win.offsetWidth;
        const maxY = window.innerHeight - win.offsetHeight;
        win.style.left =
          Math.max(0, Math.min(cx + t.clientX - ox, maxX)) + "px";
        win.style.top = Math.max(0, Math.min(cy + t.clientY - oy, maxY)) + "px";
      },
      { passive: true },
    );
    document.addEventListener("touchend", () => {
      dragging = false;
    });
  })();

  // ── FUNCIÓN: escribir en WhatsApp ─────────────────────────
  async function typeMessageInInput(text) {
    const messageInput = document.querySelector(
      "div[data-tab='10'][contenteditable='true']",
    );
    if (!messageInput) {
      console.error("No se encontró el input de WhatsApp");
      return;
    }
    messageInput.click();
    messageInput.focus();
    await new Promise((r) => setTimeout(r, 500));
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      messageInput.focus();
      if (lines[i].length > 0)
        document.execCommand("insertText", false, lines[i]);
      if (i < lines.length - 1) {
        messageInput.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        messageInput.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            shiftKey: true,
            bubbles: true,
          }),
        );
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  // ── PANEL IA ─────────────────────────────────────────────
  const audioInput = document.getElementById("ri-audio-input");
  audioInput.addEventListener("input", () =>
    audioInput.classList.toggle(
      "has-content",
      audioInput.value.trim().length > 0,
    ),
  );
  audioInput.addEventListener("mousedown", (e) => e.stopPropagation());

  const generateBtn = document.getElementById("ri-generate-btn");
  generateBtn.addEventListener("click", async () => {
    if (!API_KEY || !CUSTOM_PROMPT) {
      alert("⚠️ Por favor, configura la API Key y el Prompt en la pestaña Dropi antes de generar una respuesta ⚠️");
      return;
    }
    generateBtn.classList.add("loading");
    generateBtn.querySelector(".ri-btn-icon").textContent = "⟳";
    try {
      let conversationContext = "";
      const allMessages = Array.from(document.querySelectorAll(".copyable-text")).filter(el => el.getAttribute("data-pre-plain-text"));
      const last4Messages = allMessages; // Cambiar número segun cantidad de mensajes a enviar, si se quiere enciar todo el chat entonces borrar .slice(-4)

      last4Messages.forEach((el) => {
        const sender = el.getAttribute("data-pre-plain-text");
        const parts = sender.split("] ");
        if (!parts[1]) return;
        const senderName = parts[1].replace(":", "").trim();
        conversationContext += `${senderName === "Offerti" ? "Offerti" : "Cliente"}: ${el.innerText.trim()}\n`;
      });
      const audioText = audioInput.value.trim();
      if (audioText) conversationContext += `Cliente: ${audioText}\n`;

      // console.log("=== Mensajes enviados a la IA ===");
      // console.log(conversationContext);
      // console.log("=================================");

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: CUSTOM_PROMPT },
              {
                role: "user",
                content: `Este es el chat actual:\n\n${conversationContext}\n\nGenera una respuesta para continuar esta conversación.`,
              },
            ],
          }),
        },
      );
      const data = await response.json();
      await typeMessageInInput(data.choices[0].message.content);
      audioInput.value = "";
      audioInput.classList.remove("has-content");
    } catch (err) {
      console.error("Error IA:", err);
    } finally {
      generateBtn.classList.remove("loading");
      generateBtn.querySelector(".ri-btn-icon").textContent = "✨";
    }
  });

  document.getElementById("ri-welcome-btn").addEventListener("click", async () => {
    await typeMessageInInput(MESSAGES.WELCOME());
  });

  document
    .getElementById("ri-precios-btn")
    .addEventListener(
      "click",
      async () => {
        if (!PRICE_1 || !PRICE_2 || !PRICE_3) {
          alert("⚠️ Por favor, configura los precios en la pestaña Config antes de enviarlos ⚠️");
          return;
        }
        await typeMessageInInput(MESSAGES.PRICES());
      }
    );
  document
    .getElementById("ri-datos-btn")
    .addEventListener(
      "click",
      async () => await typeMessageInInput(MESSAGES.DATA_REQUEST()),
    );

  document
    .getElementById("ri-confirmar-btn")
    .addEventListener(
      "click",
      async () => {
        await typeMessageInInput(MESSAGES.CONFIRMATION());
      }
    );

  // ── PANEL MEDIA (3 slots) ─────────────────────────────────
  function setupSlot(n) {
    const idx = n - 1;
    const fileInput = document.getElementById(`ri-input-${n}`);
    const dropZone = document.getElementById(`ri-drop-${n}`);
    const fileList = document.getElementById(`ri-flist-${n}`);
    const sendBtn = document.getElementById(`ri-send-${n}`);
    const countLabel = document.getElementById(`ri-slot-count-${n}`);

    function renderSlot() {
      const files = mediaSlots[idx];
      fileList.innerHTML = "";
      if (files.length === 0) {
        countLabel.textContent = "sin archivos";
        countLabel.classList.remove("has-files");
        sendBtn.classList.remove("ready");
        return;
      }
      countLabel.textContent = `${files.length} archivo${files.length > 1 ? "s" : ""}`;
      countLabel.classList.add("has-files");
      sendBtn.classList.add("ready");

      files.forEach((f, i) => {
        const item = document.createElement("div");
        item.className = "ri-file-item";
        item.innerHTML = `<span class="ri-fname" title="${f.name}">${f.name}</span><span class="ri-fremove" data-i="${i}">✕</span>`;
        fileList.appendChild(item);
      });

      fileList.querySelectorAll(".ri-fremove").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          mediaSlots[idx].splice(parseInt(btn.dataset.i), 1);
          renderSlot();
        });
      });
    }

    async function addFiles(files) {
      for (const file of files) {
        try {
          const base64 = await readFileAsBase64(file);
          mediaSlots[idx].push({
            name: file.name,
            type: file.type,
            data: base64,
          });
        } catch (err) {
          console.error("Error leyendo archivo:", err);
        }
      }
      renderSlot();
    }

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () =>
      dropZone.classList.remove("drag-over"),
    );
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      if (e.dataTransfer.files.length > 0)
        addFiles(Array.from(e.dataTransfer.files));
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        addFiles(Array.from(fileInput.files));
        fileInput.value = "";
      }
    });

    sendBtn.addEventListener("click", async () => {
      if (mediaSlots[idx].length === 0) return;
      const label = sendBtn.querySelector(".ri-send-label");
      label.textContent = "Enviando…";
      sendBtn.classList.remove("ready");
      injectFiles(mediaSlots[idx]);
      await waitAndClickSendModal();
      label.textContent = "Enviar al chat actual";
      sendBtn.classList.add("ready");
    });
  }

  [1, 2, 3].forEach(setupSlot);

  // ── PANEL DROPI & CONFIG ──────────────────────────────────
  const dropiInput = document.getElementById("ri-dropi-url");
  dropiInput.addEventListener("mousedown", (e) => e.stopPropagation());

  document.getElementById("ri-dropi-btn").addEventListener("click", () => {
    const url = dropiInput.value.trim();
    if (!url) return;
    window.open(url.startsWith("http") ? url : "https://" + url, "_blank");
  });

  // Abrir también con Enter
  dropiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("ri-dropi-btn").click();
  });

  // Load config
  chrome.storage.local.get(['apiKey', 'prompt', 'price1', 'price2', 'price3', 'dropiUrl', 'productName'], (result) => {
    if (result.apiKey) { API_KEY = result.apiKey; document.getElementById("ri-config-apikey").value = API_KEY; }
    if (result.prompt) { CUSTOM_PROMPT = result.prompt; document.getElementById("ri-config-prompt").value = CUSTOM_PROMPT; }
    if (result.price1) { PRICE_1 = result.price1; document.getElementById("ri-config-price1").value = PRICE_1; }
    if (result.price2) { PRICE_2 = result.price2; document.getElementById("ri-config-price2").value = PRICE_2; }
    if (result.price3) { PRICE_3 = result.price3; document.getElementById("ri-config-price3").value = PRICE_3; }
    if (result.dropiUrl) { DROPI_URL = result.dropiUrl; document.getElementById("ri-dropi-url").value = DROPI_URL; }
    if (result.productName) { PRODUCT_NAME = result.productName; document.getElementById("ri-config-product-name").value = PRODUCT_NAME; }
  });

  // Save config
  const saveBtn = document.getElementById("ri-config-save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const apiKey = document.getElementById("ri-config-apikey").value.trim();
      const prompt = document.getElementById("ri-config-prompt").value.trim();
      const price1 = document.getElementById("ri-config-price1").value.trim();
      const price2 = document.getElementById("ri-config-price2").value.trim();
      const price3 = document.getElementById("ri-config-price3").value.trim();
      const dropiUrl = document.getElementById("ri-dropi-url").value.trim();
      const productName = document.getElementById("ri-config-product-name").value.trim();

      chrome.storage.local.set({ apiKey, prompt, price1, price2, price3, dropiUrl, productName }, () => {
        API_KEY = apiKey;
        CUSTOM_PROMPT = prompt;
        PRICE_1 = price1;
        PRICE_2 = price2;
        PRICE_3 = price3;
        DROPI_URL = dropiUrl;
        PRODUCT_NAME = productName;

        const originalInner = saveBtn.innerHTML;
        saveBtn.innerHTML = `<span>✅</span><span>Guardado</span>`;
        setTimeout(() => { saveBtn.innerHTML = originalInner; }, 2000);
      });
    });
  }
}); // fin load
