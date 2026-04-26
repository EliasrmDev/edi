'use client';

import { useRef, useState } from 'react';
import { DownloadIcon, GitHubIcon } from './icons';

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/ddpmgmfjgahalfnfmiokdjpheefndjbm?utm_source=edi-web';
const GITHUB_URL = 'https://github.com/EliasrmDev/edi';

/* ─── Real EDI brand icon SVG ─────────────────────── */
function BrandIcon({ gradId }: { gradId: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" focusable="false">
      <rect width="22" height="22" rx="6" fill={`url(#${gradId})`} />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        d="M4 7 L7.5 15 L11 9.5 L14.5 15 L18 7"
        transform="rotate(90 11 11)"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ─── Popup header — brand + segmented mode nav ────── */
function PopupHeader({ activeTab }: { activeTab: 'images' | 'text' }) {
  return (
    <div className="flex items-center justify-between border-b border-[#2e3744] bg-[#1e293b] px-3.5 py-3" aria-hidden="true">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <BrandIcon gradId={`edi-grad-${activeTab}`} />
        <span
          className="text-[13px] font-bold tracking-[-0.3px]"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          EDI
        </span>
      </div>
      {/* Mode nav — segmented control matching .mode-nav */}
      <div className="flex gap-0.5 rounded-[10px] bg-[#2e3744] p-0.5">
        <div className={`flex items-center gap-[5px] rounded-[8px] px-2 py-[5px] text-[11px] ${activeTab === 'images' ? 'bg-[#1e293b] font-semibold text-indigo-400 shadow-sm' : 'font-medium text-[#94a3b8]'}`}>
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1.5" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="4" cy="5" r="1" fill="currentColor" />
            <path d="M1 9l2.5-3 2.5 2.5 1.5-2L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Imágenes
        </div>
        <div className={`flex items-center gap-[5px] rounded-[8px] px-2 py-[5px] text-[11px] ${activeTab === 'text' ? 'bg-[#1e293b] font-semibold text-indigo-400 shadow-sm' : 'font-medium text-[#94a3b8]'}`}>
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <path d="M2 3h9M2 6.5h6M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Texto
        </div>
      </div>
    </div>
  );
}

/* ─── Left popup: Image Converter ─────────────────── */
function ImagePopup() {
  return (
    <div className="w-[258px] overflow-hidden rounded-2xl border border-[#2e3744] bg-[#0f172a] shadow-[0_24px_80px_rgba(0,0,0,.7)]">
      <PopupHeader activeTab="images" />

      {/* Tabs — underline style matching .tab/.tab.active */}
      <div className="flex border-b border-[#2e3744] bg-[#1e293b] px-2.5">
        <div className="flex-1 border-b-2 border-indigo-500 py-2.5 text-center text-[12.5px] font-semibold text-indigo-400">
          Convert File
        </div>
        <div className="flex-1 border-b-2 border-transparent py-2.5 text-center text-[12.5px] font-medium text-[#64748b]">
          Page Images
        </div>
      </div>

      {/* Panel — matching .panel */}
      <div className="flex flex-col gap-3 px-3.5 py-3.5">
        {/* Dropzone — matching .dropzone */}
        <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[#2e3744] bg-[#1e293b] px-4 py-5 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2e3744]">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" className="text-[#94a3b8]">
              <path d="M20 12v12M14 18l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 28h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-0.5 text-[13px] font-semibold text-[#f1f5f9]">Drop image here</p>
          <p className="text-[12px] text-[#64748b]">
            or <span className="text-indigo-400">click to browse</span>
          </p>
          <p className="mt-1.5 text-[10.5px] text-[#475569]">WebP · JPG · PNG · multiple files supported</p>
        </div>

        {/* Format selector — matching .format-selector/.format-btn.active */}
        <div className="flex gap-1 rounded-[8px] bg-[#2e3744] p-[3px]">
          <div className="flex-1 rounded-[6px] bg-[#1e293b] py-[7px] text-center text-[13px] font-semibold text-indigo-400 shadow-sm">
            JPG
          </div>
          <div className="flex-1 py-[7px] text-center text-[13px] font-medium text-[#64748b]">
            PNG
          </div>
        </div>

        {/* Convert & Download — matching .convert-btn */}
        <div className="flex w-full items-center justify-center gap-[7px] rounded-[8px] bg-indigo-600 py-[11px] text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(99,102,241,.4)]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M2 8a6 6 0 1 0 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 5.5L8 2l3 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Convert &amp; Download
        </div>
      </div>
    </div>
  );
}

/* ─── Right popup: Text Editor ─────────────────────── */
function TextPopup() {
  return (
    <div className="w-[268px] overflow-hidden rounded-2xl border border-[#2e3744] bg-[#0f172a] shadow-[0_24px_80px_rgba(0,0,0,.7)]">
      <PopupHeader activeTab="text" />

      {/* Text sub-tabs — matching .text-tabs/.text-tab.active */}
      <div className="flex border-b border-[#2e3744] bg-[#1e293b]">
        <div className="flex w-1/2 items-center justify-center gap-[5px] border-b-2 border-indigo-500 py-2 text-[12px] font-semibold text-indigo-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 8.5L8 2l2 2-6.5 6.5H1.5V8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Editor
        </div>
        <div className="flex w-1/2 items-center justify-center gap-[5px] border-b-2 border-transparent py-2 text-[12px] font-medium text-[#64748b]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6 1v1.2M6 9.8V11M1 6h1.2M9.8 6H11M2.4 2.4l.85.85M8.75 8.75l.85.85M9.6 2.4l-.85.85M3.25 8.75l-.85.85" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Ajustes
        </div>
      </div>

      {/* Editor panel — matching .settings-panel */}
      <div className="px-3.5 py-3.5">
        {/* Textarea — matching .mini-section-label + .mini-editor-textarea */}
        <p className="mb-[5px] text-[10px] font-bold uppercase tracking-[0.07em] text-[#64748b]">Texto a editar</p>
        <div className="mb-2 rounded-[6px] border border-[#2e3744] bg-[#1e293b] px-2.5 py-2">
          <p className="text-[12.5px] leading-[1.5] text-[#475569]">Escribí o pegá tu texto aquí…</p>
        </div>

        {/* Formato group — matching .mini-group + .mini-style-btn */}
        <div className="mb-1">
          <p className="mb-[5px] text-[10px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Formato</p>
          <div className="flex gap-1">
            {(['AA', 'aa', 'Aa'] as const).map((label) => (
              <div
                key={label}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#2e3744] bg-[#2e3744] text-[1rem] font-semibold text-[#f1f5f9]"
              >
                {label}
              </div>
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#2e3744] bg-[#2e3744] text-[#c4c4c4]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2L12 4.5 5.5 11H3V8.5L9.5 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tono — matching .mini-group-wrapper (fieldset with floating label on border) */}
        <div className="relative mt-5 mb-2 rounded-[6px] border border-[#2e3744] px-1.5 pb-1.5 pt-[18px]">
          {/* Floating header — .mini-tone-header absolutely positioned on the border */}
          <div className="absolute -top-[10px] left-3 flex items-center gap-1.5 rounded-full bg-[#0f172a] pl-[6px]">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#94a3b8]">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5a3.5 3.5 0 013.5 3.5c0 1.4-.8 2.6-2 3.2L8 10H4l.5-1.8A3.5 3.5 0 016 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Tono
            </span>
            {/* Local / IA pill toggle — matching .mini-tone-mode/.mini-tone-mode-btn */}
            <div className="flex overflow-hidden rounded-full border border-[#2e3744] bg-[#2e3744]">
              <span className="rounded-full bg-[#1e293b] px-2 py-[2px] text-[10.5px] font-semibold text-[#f1f5f9] shadow-sm">Local</span>
              <span className="px-2 py-[2px] text-[10.5px] font-semibold text-[#94a3b8]">IA ✦</span>
            </div>
          </div>

          {/* Verbal mode — segmented control matching mode-nav style */}
          <div className="mb-[5px] flex rounded-[8px] border border-[#2e3744] bg-[#0f172a] p-0.5 text-[10px]">
            <div className="flex-1 rounded-[6px] bg-[#2e3744] py-1.5 text-center font-semibold text-[#f1f5f9] shadow-sm">
              Indicativo
            </div>
            <div className="flex-1 py-1.5 text-center font-medium text-[#94a3b8]">Imperativo</div>
          </div>

          {/* Tone cards — matching .mini-tone-cards/.mini-tone-card */}
          <div className="grid grid-cols-3 gap-[5px]">
            {[
              { label: 'Voseo CR', sub: 'Costa Rica', active: true },
              { label: 'Tuteo', sub: 'Estándar', active: false },
              { label: 'Formal', sub: 'Usted', active: false },
            ].map(({ label, sub, active }) => (
              <div
                key={label}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-[8px] border px-1.5 py-[9px] text-center ${
                  active ? 'border-indigo-500 bg-[#1e1b4b]' : 'border-[#2e3744] bg-[#1e293b]'
                }`}
              >
                <p className={`text-[11.5px] font-semibold leading-none ${active ? 'text-[#f1f5f9]' : 'text-[#c4c4c4]'}`}>{label}</p>
                <p className="mt-0.5 text-[9.5px] text-[#64748b]">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions bar — matching .mini-actions-bar */}
        <div className="flex items-center gap-[6px] border-t border-[#2e3744] pt-[10px]">
          {/* AI buttons — matching .mini-btn.mini-btn--ai */}
          <div className="flex flex-1 gap-[5px]">
            <div className="rounded-[6px] border border-indigo-500/30 bg-[#1e1b4b] px-[9px] py-[5px] text-[11.5px] font-medium text-indigo-400">
              ✦ Ortografía
            </div>
            <div className="rounded-[6px] border border-indigo-500/30 bg-[#1e1b4b] px-[9px] py-[5px] text-[11.5px] font-medium text-indigo-400">
              ✦ Copy
            </div>
          </div>
          {/* Copy button — matching .mini-copy-btn */}
          <div className="flex shrink-0 items-center gap-[5px] rounded-[6px] border border-[#2e3744] bg-[#1e293b] px-[11px] py-[5px] text-[11.5px] font-medium text-[#94a3b8]">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Copiar
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Hero section ─────────────────────────────── */
export function Hero() {
  const [imageInFront, setImageInFront] = useState(true);
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);
  const dragInvert = useRef(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, invert = false) {
    dragStartX.current = e.clientX;
    didDrag.current = false;
    dragInvert.current = invert;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    if (Math.abs(e.clientX - dragStartX.current) > 8) didDrag.current = true;
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    const effective = dragInvert.current ? -delta : delta;
    if (Math.abs(delta) > 30) setImageInFront(effective > 0);
    dragStartX.current = null;
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #0C0B2E 0%, #0F0D38 45%, #0f172a 100%)' }}
      aria-labelledby="hero-heading"
    >
      {/* Dot-grid atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.032]"
        style={{
          backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-6 pt-2 pb-10">
        <div className="flex flex-col items-center gap-14 lg:flex-row lg:items-center lg:gap-4">

          {/* ── LEFT: copy ─────────────────────────────── */}
          <div className="w-full text-center lg:max-w-[520px] lg:flex-shrink-0 lg:text-left">

            {/* Badge */}
            <div className="mb-4 mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.06] px-4 py-1.5 text-[12.5px] font-semibold tracking-wide text-white/85">
              ★ Extensión Chrome gratuita
            </div>

            {/* Heading */}
            <h1
              id="hero-heading"
              className="mb-6 text-[clamp(36px,4.8vw,62px)] font-extrabold leading-[1.06] tracking-tight text-white"
            >
              Convertí imágenes &amp;<br />
              <span className="bg-gradient-to-r from-[#818cf8] to-[#a78bfa] bg-clip-text text-transparent">
                editá texto
              </span>{' '}
              al instante<br />
              en Chrome
            </h1>

            {/* Description */}
            <p className="mx-auto mb-9 max-w-[480px] text-[16px] leading-relaxed text-white/70 lg:mx-0">
              Convertí WebP a JPG y PNG en un clic — y editá tu texto directamente en la extensión.
              Corregí ortografía, cambiá el tono con nuestro conversor de tratamiento verbal y
              formateá como quieras. Todo en una sola extensión.
            </p>

            {/* CTA buttons */}
            <div className="mb-12 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_6px_28px_rgba(67,56,202,.45)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-[0_10px_36px_rgba(67,56,202,.55)] hover:no-underline"
              >
                <DownloadIcon />
                Agregar a Chrome — Gratis
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.2] bg-white/[0.06] px-6 py-3.5 text-[15px] font-semibold text-white/90 transition-all hover:border-white/[0.35] hover:bg-white/[0.1] hover:no-underline"
              >
                <GitHubIcon />
                Ver código fuente
                <span className="sr-only">(abre en otra pestaña)</span>
              </a>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap items-start justify-center gap-7 lg:justify-start">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-xl" aria-hidden="true">
                  🖼️
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Convertí imágenes</p>
                  <p className="text-[12px] leading-snug text-white/45">
                    WebP a JPG y PNG<br />al instante.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-xl" aria-hidden="true">
                  ✏️
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Editá texto</p>
                  <p className="text-[12px] leading-snug text-white/45">
                    Mejorá tu escritura<br />sin salir de la página.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: two floating popup mockups ──────── */}
          <div className="relative flex w-full flex-1 flex-col items-center gap-6 lg:items-end">
            <span className="sr-only">Vista previa de EDI: conversor de imágenes y editor de texto</span>

            {/* Drag/click area — purely visual, no focusable content */}
            <div
              className="relative h-[480px] w-[520px] select-none max-[520px]:origin-top"
              aria-hidden="true"
            >
              {/* ImagePopup — spring-animates between front and back */}
              <div
                className="popup-img-default absolute left-0 top-0 touch-pan-y cursor-grab active:cursor-grabbing transition-all duration-[480ms] ease-[cubic-bezier(.34,1.56,.64,1)]"
                style={
                  imageInFront
                    ? { transform: 'translate(182px,0) scale(1)', zIndex: 20, opacity: 1 }
                    : { transform: 'translate(72px,40px) scale(0.95)', zIndex: 10, opacity: 0.72 }
                }
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={() => { if (!didDrag.current) setImageInFront(true); }}
              >
                <ImagePopup />
              </div>

              {/* TextPopup — spring-animates between front and back */}
              <div
                className="popup-txt-default absolute right-0 top-0 touch-pan-y cursor-grab active:cursor-grabbing transition-all duration-[480ms] ease-[cubic-bezier(.34,1.56,.64,1)]"
                style={
                  imageInFront
                    ? { transform: 'translate(-180px,40px) scale(0.95)', zIndex: 10, opacity: 0.72 }
                    : { transform: 'translate(-80px,0) scale(1)', zIndex: 20, opacity: 1 }
                }
                onPointerDown={(e) => handlePointerDown(e, true)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={() => { if (!didDrag.current) setImageInFront(false); }}
              >
                <TextPopup />
              </div>

            </div>

              {/* Accessible nav dots — outside aria-hidden, keyboard reachable */}
              <div
                className="flex items-center justify-center gap-2 w-[520px] max-[520px]:origin-top" role="group" aria-label="Vista de la extensión"
                style={{ position: 'relative', bottom: '-100%' }}
              >
                <button
                  className={`h-2 w-10 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] ${
                    imageInFront ? 'w-6 bg-indigo-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label="Ver conversor de imágenes"
                  aria-pressed={imageInFront}
                  onClick={() => setImageInFront(true)}
                />
                <button
                  className={`h-2 w-10 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] ${
                    !imageInFront ? 'w-6 bg-indigo-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label="Ver editor de texto"
                  aria-pressed={!imageInFront}
                  onClick={() => setImageInFront(false)}
                />
              </div>

          </div>

        </div>
      </div>
    </section>
  );
}
