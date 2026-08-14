/* ============================================================
   Tang Ji — Silueta esquemática para el Atlas interactivo
   Dibujo original en SVG (no es una foto ni un escaneo de libro),
   mismo trazo para vista frontal y posterior; en la posterior se
   añade una línea central a modo de columna para diferenciarla.
   viewBox 0 0 200 400 — las coordenadas de los marcadores se
   guardan en % sobre este mismo lienzo.
   ============================================================ */

const BODY_SILHOUETTE_SVG = {
  front: `
    <svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg" class="body-svg">
      <g fill="var(--jade-dim)" stroke="var(--brass)" stroke-width="1.5" stroke-linejoin="round">
        <circle cx="100" cy="35" r="28"/>
        <rect x="90" y="58" width="20" height="16"/>
        <path d="M65,74 Q100,63 135,74 L145,222 Q100,238 55,222 Z"/>
        <path d="M64,80 L24,188 L36,200 L72,110 Z"/>
        <path d="M136,80 L176,188 L164,200 L128,110 Z"/>
        <circle cx="29" cy="196" r="11"/>
        <circle cx="171" cy="196" r="11"/>
        <path d="M58,222 L48,392 L75,392 L86,226 Z"/>
        <path d="M142,222 L152,392 L125,392 L114,226 Z"/>
        <ellipse cx="59" cy="396" rx="17" ry="8"/>
        <ellipse cx="141" cy="396" rx="17" ry="8"/>
      </g>
    </svg>`,
  back: `
    <svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg" class="body-svg">
      <g fill="var(--jade-dim)" stroke="var(--brass)" stroke-width="1.5" stroke-linejoin="round">
        <circle cx="100" cy="35" r="28"/>
        <rect x="90" y="58" width="20" height="16"/>
        <path d="M65,74 Q100,63 135,74 L145,222 Q100,238 55,222 Z"/>
        <path d="M64,80 L24,188 L36,200 L72,110 Z"/>
        <path d="M136,80 L176,188 L164,200 L128,110 Z"/>
        <circle cx="29" cy="196" r="11"/>
        <circle cx="171" cy="196" r="11"/>
        <path d="M58,222 L48,392 L75,392 L86,226 Z"/>
        <path d="M142,222 L152,392 L125,392 L114,226 Z"/>
        <ellipse cx="59" cy="396" rx="17" ry="8"/>
        <ellipse cx="141" cy="396" rx="17" ry="8"/>
      </g>
      <line x1="100" y1="64" x2="100" y2="230" stroke="var(--brass)" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>
    </svg>`
};
