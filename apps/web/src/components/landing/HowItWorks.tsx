const STEPS = [
  {
    icon: '📦',
    title: 'Instalá la extensión',
    body: 'Agregala desde la Chrome Web Store. Sin registro, sin permisos para leer tu historial o datos personales.',
  },
  {
    icon: '🖱️',
    title: 'Clic derecho o seleccioná',
    body: 'Hacé clic derecho en una imagen para convertirla, o seleccioná texto para transformarlo. También podés arrastrar archivos al popup.',
  },
  {
    icon: '✅',
    title: 'Resultado al instante',
    body: 'Tu imagen convertida se descarga automáticamente. Tu texto transformado se aplica directamente en el campo de origen.',
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[var(--c-bg)] py-20"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="mb-13">
          <p
            className="mb-2.5 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]"
            aria-hidden="true"
          >
            Cómo funciona
          </p>
          <h2
            id="how-heading"
            className="mb-3.5 text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight"
          >
            Tres pasos, cero complicaciones
          </h2>
          <p className="max-w-[520px] text-[17px] text-[var(--c-text-2)]">
            Dos flujos según cómo trabajás — popup o clic derecho.
          </p>
        </div>

        <ol
          className="grid list-none gap-5 sm:grid-cols-3"
          aria-label="Pasos para usar la extensión"
          style={{ counterReset: 'step' }}
        >
          {STEPS.map(({ icon, title, body }) => (
            <li
              key={title}
              className="relative rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-7"
              style={{ counterIncrement: 'step' }}
            >
              <div
                className="absolute right-[22px] top-[22px] flex h-7 w-7 items-center justify-center rounded-full bg-[var(--c-faint)] text-xs font-extrabold text-[var(--color-primary)] before:content-[counter(step)]"
                aria-hidden="true"
              />
              <div className="mb-3 text-[28px]" aria-hidden="true">
                {icon}
              </div>
              <h3 className="mb-1.5 text-[15px] font-bold">{title}</h3>
              <p className="text-[13.5px] text-[var(--c-text-2)]">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
