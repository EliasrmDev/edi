import { DownloadIcon } from './icons';

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/ddpmgmfjgahalfnfmiokdjpheefndjbm?utm_source=edi-web';

export function CTASection() {
  return (
    <section
      id="install"
      className="bg-gradient-to-br from-[#eef2ff] to-[var(--c-bg)] py-25 text-center dark:from-[#1a1740] dark:to-[#0f172a]"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <h2
          id="cta-heading"
          className="mb-3.5 text-[clamp(28px,4vw,44px)] font-extrabold tracking-tight"
        >
          ¿Listo para editar y convertir sin complicaciones?
        </h2>
        <p className="mb-9 text-[17px] text-[var(--c-text-2)]">
          Agregá la extensión en segundos — es gratis, para siempre.
        </p>
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[10px] bg-indigo-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,.3)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:text-white hover:shadow-[0_8px_24px_rgba(99,102,241,.4)] hover:no-underline"
        >
          <DownloadIcon />
          Agregar a Chrome — Gratis
        </a>
        <p className="mt-4 text-[13px] text-[var(--c-text-3)]">
          Compatible con Chrome 112+. Manifest V3.
        </p>
      </div>
    </section>
  );
}
