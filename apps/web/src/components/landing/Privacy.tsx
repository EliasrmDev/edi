const CARDS = [
  {
    icon: '🔒',
    title: 'Cero subidas',
    body: 'La conversión se ejecuta completamente en tu navegador usando la API Canvas. Los archivos se procesan en memoria y se descartan de inmediato.',
  },
  {
    icon: '🕵️',
    title: 'Sin rastreo',
    body: 'Cero analíticas, cero telemetría. Sin cookies, sin solicitudes externas, sin scripts de terceros.',
  },
  {
    icon: '📖',
    title: 'Código abierto',
    body: 'Cada línea de código es pública. Auditalo vos mismo. Compilalo vos mismo. Confiá, pero verificá.',
  },
  {
    icon: '🛡️',
    title: 'Permisos mínimos',
    body: 'Solo pedimos lo necesario: menús contextuales, descargas y acceso a la pestaña activa. Sin historial, sin marcadores, sin identidad.',
  },
] as const;

export function Privacy() {
  return (
    <section
      id="privacy"
      className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] py-20 text-[#e0e7ff]"
      aria-labelledby="privacy-heading"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="mb-13">
          <p
            className="mb-2.5 text-xs font-bold uppercase tracking-widest text-[#a5b4fc]"
            aria-hidden="true"
          >
            Privacidad primero
          </p>
          <h2
            id="privacy-heading"
            className="mb-3.5 text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight text-white"
          >
            Tus archivos nunca salen de tu dispositivo
          </h2>
          <p className="max-w-[520px] text-[17px] text-[#a5b4fc]">
            Creamos esta extensión porque la mayoría de conversores en línea suben tus archivos a
            servidores desconocidos. Creemos que eso está mal.
          </p>
        </div>

        <ul className="grid list-none gap-4.5 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {CARDS.map(({ icon, title, body }) => (
            <li
              key={title}
              className="rounded-[14px] border border-white/10 bg-white/[.08] p-6"
            >
              <div className="mb-2.5 text-[28px]" aria-hidden="true">
                {icon}
              </div>
              <h3 className="mb-1.5 text-[15px] font-bold text-white">{title}</h3>
              <p className="text-[13.5px] leading-relaxed text-[#a5b4fc]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
