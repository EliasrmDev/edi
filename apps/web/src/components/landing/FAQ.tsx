'use client';

const ITEMS = [
  {
    q: '¿Funciona en todos los sitios web?',
    a: 'Sí. El menú de clic derecho aparece en cualquier imagen de cualquier sitio web, incluyendo páginas HTTPS. La extensión usa host_permissions de Chrome para obtener imágenes que de otro modo serían bloqueadas por CORS.',
  },
  {
    q: '¿Cuál es el tamaño máximo de archivo?',
    a: 'La conversión local soporta archivos de hasta 10 MB.',
  },
  {
    q: '¿Pierdo calidad al convertir a JPG?',
    a: 'JPEG es un formato con pérdida, así que cierta reducción de calidad es esperada. La calidad por defecto es 92 %, visualmente casi idéntica al original para la mayoría de fotos. Usá el control deslizante para equilibrar tamaño vs. fidelidad, o elegí PNG para salida sin pérdida.',
  },
  {
    q: '¿JPG preserva la transparencia?',
    a: 'No — JPEG no soporta transparencia. La extensión rellena automáticamente las áreas transparentes con blanco antes de codificar. Elegí PNG para conservar la transparencia.',
  },
  {
    q: '¿El código fuente está disponible?',
    a: 'Sí, la extensión es completamente de código abierto y está disponible en GitHub. Podés auditar el código, compilarlo vos mismo o contribuir mejoras.',
  },
  {
    q: '¿Cómo funciona la edición de texto?',
    a: 'Seleccioná cualquier texto en una página web y aparecerá un botón flotante. Hacé clic para abrir el panel de EDI donde podés transformar el tono (voseo, tuteo, ustedeo), cambiar mayúsculas/minúsculas o corregir ortografía con IA.',
  },
] as const;

export function FAQ() {
  return (
    <section
      id="faq"
      className="bg-[var(--c-surface)] py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="mb-13">
          <p
            className="mb-2.5 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]"
            aria-hidden="true"
          >
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight"
          >
            Preguntas frecuentes
          </h2>
        </div>

        <div className="flex max-w-[700px] flex-col">
          {ITEMS.map(({ q, a }) => (
            <details
              key={q}
              className="group border-b border-[var(--c-border)] py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  className="shrink-0 text-xl leading-none text-[var(--color-primary)] transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-[var(--c-text-2)]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
