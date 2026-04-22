const FEATURES = [
  {
    icon: '⚡',
    title: 'Conversión local instantánea',
    body: 'Usa la API Canvas de Chrome directamente en tu navegador. Sin viajes al servidor — las conversiones se completan en milisegundos, incluso con imágenes grandes.',
  },
  {
    icon: '🖱️',
    title: 'Menú de clic derecho',
    body: 'Hacé clic derecho en cualquier imagen en cualquier sitio web y elegí "Convertir a JPG" o "Convertir a PNG". El archivo se descarga de inmediato.',
  },
  {
    icon: '📄',
    title: 'Escáner de imágenes de página',
    body: 'Abrí el popup y cambiá a "Imágenes de página" para ver todas las imágenes WebP en la página actual. Convertí y descargá cualquiera con un clic.',
  },
  {
    icon: '🎚️',
    title: 'Calidad JPEG ajustable',
    body: 'Ajustá la compresión JPEG del 1 al 100 % para equilibrar tamaño y calidad visual. La salida PNG siempre es sin pérdida y conserva la transparencia.',
  },
  {
    icon: '🖼️',
    title: 'Soporte de transparencia',
    body: 'La salida PNG preserva la transparencia del canal alfa perfectamente. La salida JPEG rellena las áreas transparentes con blanco.',
  },
  {
    icon: '✏️',
    title: 'Edición inteligente de texto',
    body: 'Seleccioná cualquier texto en el navegador y transformalo: mayúsculas, minúsculas, voseo costarricense, tuteo, ustedeo y más — sin salir de la página.',
  },
  {
    icon: '🤖',
    title: 'Corrección ortográfica con IA',
    body: 'Corregí la ortografía de tu texto en español usando inteligencia artificial. Ideal para correos, documentos y formularios.',
  },
  {
    icon: '🇨🇷',
    title: 'Localización es-CR',
    body: 'Diseñada para español de Costa Rica. Convertí entre voseo, tuteo y ustedeo con un clic, adaptando el tono de tu comunicación.',
  },
] as const;

export function Features() {
  return (
    <section
      id="features"
      className="bg-[var(--c-surface)] py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="mb-13">
          <p
            className="mb-2.5 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]"
            aria-hidden="true"
          >
            Funciones
          </p>
          <h2
            id="features-heading"
            className="mb-3.5 text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight"
          >
            Todo lo que necesitás, nada que sobre
          </h2>
          <p className="max-w-[520px] text-[17px] text-[var(--c-text-2)]">
            Simple por diseño — potente cuando lo necesitás. Editá texto y convertí imágenes sin
            salir de Chrome.
          </p>
        </div>

        <ul
          className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {FEATURES.map(({ icon, title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] p-7 transition-shadow hover:border-[#c7d2fe] hover:shadow-[0_8px_24px_rgba(0,0,0,.07)] dark:hover:border-[#4338ca] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,.3)]"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-faint)] text-[22px]"
                aria-hidden="true"
              >
                {icon}
              </div>
              <h3 className="mb-1.5 text-base font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--c-text-2)]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
