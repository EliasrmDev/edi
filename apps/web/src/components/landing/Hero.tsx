import { DownloadIcon, GitHubIcon, StarIcon } from './icons';

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/ddpmgmfjgahalfnfmiokdjpheefndjbm?utm_source=edi-web';
const GITHUB_URL = 'https://github.com/EliasrmDev/edi';

const TRUST_BADGES = [
  '100 % gratis, sin anuncios',
  'Código abierto',
  'Sin cuenta requerida',
  'Manifest V3',
] as const;

export function Hero() {
  return (
    <section
      className="bg-gradient-to-br from-[#f0f0ff] to-[var(--c-bg)] py-20 text-center dark:from-[#1a1740] dark:to-[#0f172a] max-sm:py-13"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--c-faint)] px-3.5 py-1 text-[13px] font-semibold tracking-wide text-[var(--color-primary)]">
          <StarIcon />
          Extensión Chrome gratuita
        </div>

        <h1
          id="hero-heading"
          className="mx-auto mb-5 max-w-3xl text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.12] tracking-tight text-[var(--c-text-1)]"
        >
          Editá texto y convertí imágenes{' '}
          <span className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            directamente en Chrome
          </span>
        </h1>

        <p className="mx-auto mb-9 max-w-[560px] text-lg text-[var(--c-text-2)]">
          Transformá, corregí y adaptá texto en español con IA — o convertí imágenes WebP a JPG y
          PNG sin salir del navegador. Todo 100 % local, sin subir archivos.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,.3)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] hover:text-white hover:shadow-[0_8px_24px_rgba(99,102,241,.4)] hover:no-underline"
          >
            <DownloadIcon />
            Agregar a Chrome — Gratis
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-[var(--c-border)] bg-[var(--c-surface)] px-6 py-3.5 text-[15px] font-semibold text-[var(--c-text-1)] transition-colors hover:border-[var(--color-primary)] hover:no-underline"
          >
            <GitHubIcon />
            Ver código fuente
            <span className="sr-only">(abre en otra pestaña)</span>
          </a>
        </div>

        {/* Trust badges */}
        <ul
          className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[13px] text-[var(--c-text-2)]"
          aria-label="Beneficios clave"
        >
          {TRUST_BADGES.map((badge) => (
            <li key={badge} className="before:mr-1 before:font-bold before:text-[var(--color-success)] before:content-['✓']">
              {badge}
            </li>
          ))}
        </ul>

        {/* Popup mockup */}
        <div
          className="mx-auto mt-15 max-w-[420px] overflow-hidden rounded-2xl border border-[var(--c-border)] bg-white shadow-[0_24px_64px_rgba(0,0,0,.12),0_2px_8px_rgba(0,0,0,.06)] dark:bg-[#1e293b] dark:shadow-[0_24px_64px_rgba(0,0,0,.5),0_2px_8px_rgba(0,0,0,.3)]"
          role="img"
          aria-label="Vista previa del popup de la extensión con zona de arrastre, selector JPG/PNG y botón de conversión"
        >
          <div
            className="flex items-center gap-2.5 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-4.5 py-3.5"
            aria-hidden="true"
          >
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
            </div>
            <span className="ml-1 text-[13px] font-semibold text-white">EDI — LOCAL</span>
          </div>

          <div className="p-5" aria-hidden="true">
            <div className="mb-3.5 rounded-xl border-2 border-dashed border-[#c7d2fe] bg-[#eef2ff] px-7 py-7 text-center text-[13px] text-[#6366f1] dark:border-[#3730a3] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]">
              <div className="mb-1.5 text-[28px]">🖼️</div>
              <strong>Arrastrá una imagen WebP aquí</strong>
              <br />
              <small className="text-[#6366f1] dark:text-[#a5b4fc]">
                o hacé clic para buscar
              </small>
            </div>
            <div className="mb-3 flex gap-1.5">
              <div className="flex-1 rounded-[7px] bg-[#6366f1] py-[7px] text-center text-xs font-bold text-white">
                JPG
              </div>
              <div className="flex-1 rounded-[7px] bg-[#f1f5f9] py-[7px] text-center text-xs font-bold text-[#64748b] dark:bg-[#334155] dark:text-[#94a3b8]">
                PNG
              </div>
            </div>
            <div className="w-full rounded-lg bg-[#6366f1] py-[11px] text-center text-[13px] font-bold text-white">
              ✓ Convertir y descargar
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
