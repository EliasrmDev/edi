import type { TransformationType, ToneType, VerbalMode, CopyConfig } from '@edi/shared';

const DEFAULT_COPY_CONFIG: CopyConfig = {
  tratamiento: 'voseo',
  modoVerbal: 'imperativo',
  contexto: 'anuncio',
  canal: 'web',
  formalidad: 'medio',
  objetivo: 'convertir',
  intensidadCambio: 'moderada',
};

export class AIPromptService {
  /**
   * Build a complete system prompt for the AI model.
   * Combines base instructions + tone-specific instructions + task instructions.
   */
  buildSystemPrompt(transformation: TransformationType, tone: ToneType, verbalMode?: VerbalMode, copyConfig?: CopyConfig): string {
    // Copy motor has its own self-contained prompt — skip base + tone instructions
    if (transformation === 'copy-writing-cr') {
      return this.buildCopySystemPrompt(copyConfig ?? DEFAULT_COPY_CONFIG);
    }
    const baseInstructions = `
Eres un corrector de texto experto en español latinoamericano,
con énfasis especial en el español costarricense (Costa Rica).

REGLAS ABSOLUTAS:
1. Devuelve ÚNICAMENTE el texto corregido. Sin explicaciones, sin comillas, sin prefijos.
2. Preserva el significado original exactamente.
3. Preserva los saltos de línea y estructura del texto original.
4. No añadas ni elimines información.
5. Si el texto ya es correcto, devuélvelo sin cambios.
`;

    const toneInstructions = this.buildToneInstructions(tone);
    const verbalModeInstructions = verbalMode === 'imperativo' ? this.buildVerbalModeInstructions(tone) : '';
    const transformationInstructions = this.buildTransformationInstructions(transformation);

    return [baseInstructions, toneInstructions, verbalModeInstructions, transformationInstructions]
      .filter(Boolean)
      .join('\n\n');
  }

  private buildToneInstructions(tone: ToneType): string {
    switch (tone) {
      case 'voseo-cr':
        return `
TONO: Voseo costarricense (informal)
- Usa "vos" como pronombre de segunda persona singular informal
- Usa conjugaciones del voseo costarricense:
  * Presente indicativo: eliminás el -s final de la segunda persona plural peninsular
    Ejemplos: vos tenés (no tienes), vos querés (no quieres), vos hablás (no hablas)
  * NO uses formas del voseo rioplatense si son diferentes al costarricense
- Mantén el vocabulario tico cuando sea apropiado (mae, diay, tuanis, etc.)
  SOLO si ya estaba presente en el texto original
- Tono cercano, cálido, informal pero respetuoso
`;

      case 'tuteo':
        return `
TONO: Tuteo (neutral latinoamericano)
- Usa "tú" como pronombre de segunda persona singular informal
- Conjugaciones estándar del español latinoamericano:
  Ejemplos: tú tienes, tú quieres, tú hablas
- Evita regionalismos específicos (ni voseo ni ustedeo)
- Tono neutral, ampliamente comprensible en toda Latinoamérica
`;

      case 'ustedeo':
        return `
TONO: Ustedeo (formal/respetuoso, uso costarricense)
- Usa "usted" como pronombre de segunda persona singular
- IMPORTANTE: En Costa Rica, el ustedeo se usa también en contextos íntimos
  (parejas, familia cercana) además del formal. Distingue el contexto:
  * Formal/profesional: tono distante y respetuoso
  * Íntimo costarricense: usted + vocabulario cercano y afectuoso
- Conjugaciones: usted tiene, usted quiere, usted habla
- Nunca uses "vos" ni "tú" en modo ustedeo
`;

      default: {
        const _exhaustive: never = tone;
        void _exhaustive;
        return '';
      }
    }
  }

  private buildVerbalModeInstructions(tone: ToneType): string {
    const examplesByTone = {
      'voseo-cr': 'hablá, comprá, mirá, elegí, empezá, probá, aprovechá',
      'tuteo':    'habla, compra, mira, elige, empieza, prueba, aprovecha',
      'ustedeo':  'hable, compre, mire, elija, empiece, pruebe, aproveche',
    } as const;

    return `
MODO VERBAL: Imperativo (invitación directa a la acción)
- Usa formas imperativas directas y claras — ideales para CTAs, botones, titulares y llamadas a la acción
- Ejemplos para este tratamiento: ${examplesByTone[tone] ?? ''}
- Mantén el tono y registro del tratamiento seleccionado — no lo cambies
- Evita sonar autoritario o agresivo; el imperativo debe invitar, no exigir
- Cuando el texto ya esté en imperativo y sea correcto, consérvalo tal cual
`;
  }

  private buildTransformationInstructions(transformation: TransformationType): string {
    switch (transformation) {
      case 'correct-orthography':
        return `
TAREA: Corrección ortográfica y gramatical
- Corrige errores de ortografía (tildes, uso de b/v, h, etc.)
- Corrige errores de puntuación
- Corrige concordancia de género y número
- Corrige tiempos verbales incorrectos
- Corrige uso de mayúsculas (nombres propios, inicio de oración)
- NO reformules frases que ya sean correctas
- Prioriza las normas del español latinoamericano (RAE + Panhispánico)
`;

      case 'tone-voseo-cr':
        return `
TAREA: Adaptación a voseo costarricense para texto publicitario

Estás adaptando copy publicitario o comercial para conectar con el público costarricense
a través del voseo — el registro más natural, cercano y auténtico del tico.

CONVERSIONES OBLIGATORIAS:
- Pronombres: tú → vos | ti → vos | contigo → con vos
- Presente indicativo — elimina la diptongación y añade tilde al final:
  * tienes → tenés | quieres → querés | puedes → podés | eres → sos
  * sabes → sabés | haces → hacés | vienes → venís | sientes → sentís
- Imperativo (CLAVE en publicidad): forma voseante directa y energética
  * ¡Ven! → ¡Vení! | ¡Prueba! → ¡Probá! | ¡Aprovecha! → ¡Aprovechá!
  * ¡Elige! → ¡Elegí! | ¡Descubre! → ¡Descubrí! | ¡Conoce! → ¡Conocé!
  * ¡Pide! → ¡Pedí! | ¡Haz! → ¡Hacé! | ¡Ve! → ¡Andá! | ¡Di! → ¡Decí!
- Posesivos: tu/tuyo/tuya no cambian

TILDES EN VOSEO — OBLIGATORIAS SIEMPRE:
Tenés, querés, podés, sabés, hacés, venís, sentís, vivís (NUNCA sin tilde)

ESTILO PUBLICITARIO:
- El voseo crea confianza y cercanía emocional inmediata con el público tico
- Imperativo voseante en CTAs: más directo y natural que el infinitivo
- Preserva la energía, el ritmo y la persuasión del texto original
- Si el original ya usa vocabulario tico (mae, tuanis, diay), mantenlo
- Cuida la ortografía general: tildes, puntuación y mayúsculas correctas
`;

      case 'tone-tuteo':
        return `
TAREA: Adaptación a tuteo para texto publicitario (alcance latinoamericano)

Estás adaptando copy publicitario o comercial al tuteo estándar latinoamericano —
el registro neutro, moderno y de amplio alcance en toda la región.

CONVERSIONES OBLIGATORIAS:
- Pronombres: vos → tú | usted → tú (si el contexto es informal)
- Presente indicativo — formas estándar diptongadas:
  * tenés → tienes | querés → quieres | podés → puedes | sos → eres
  * sabés → sabes | hacés → haces | venís → vienes | sentís → sientes
- Imperativo: segunda persona singular estándar
  * ¡Vení! → ¡Ven! | ¡Probá! → ¡Prueba! | ¡Aprovechá! → ¡Aprovecha!
  * ¡Elegí! → ¡Elige! | ¡Descubrí! → ¡Descubre! | ¡Conocé! → ¡Conoce!
  * ¡Pedí! → ¡Pide! | ¡Hacé! → ¡Haz! | ¡Andá! → ¡Ve! | ¡Decí! → ¡Di!
- Posesivos: tu/tuyo/tuya no cambian

ORTOGRAFÍA EN TUTEO:
- Tú (pronombre) lleva tilde; tu (posesivo) no
- Formas diptongadas no llevan tilde en la sílaba verbal final: tienes, quieres, puedes

ESTILO PUBLICITARIO:
- Tono moderno, dinámico e inclusivo — conecta con audiencias jóvenes y urbanas
- Alcance neutro latinoamericano: evita regionalismos que limiten la audiencia
- CTAs directos: "¡Descubre!", "¡Aprovecha ya!", "¡Pruébalo!"
- Preserva la energía, el ritmo y la persuasión del texto original
- Cuida la ortografía general: tildes, puntuación y mayúsculas correctas
`;

      case 'tone-ustedeo':
        return `
TAREA: Adaptación a ustedeo para texto publicitario (formal/institucional)

Estás adaptando copy publicitario o comercial al ustedeo — el registro formal y
respetuoso, adecuado para publicidad institucional, financiera, de salud o servicios
profesionales. En Costa Rica el ustedeo también expresa cercanía íntima.

CONVERSIONES OBLIGATORIAS:
- Pronombres: vos → usted | tú → usted
- Presente indicativo — tercera persona singular:
  * tenés/tienes → tiene | querés/quieres → quiere | podés/puedes → puede
  * sos/eres → es | sabés/sabes → sabe | hacés/haces → hace
- Imperativo: forma subjuntiva (ustedeo)
  * ¡Probá!/¡Prueba! → ¡Pruebe! | ¡Aprovechá!/¡Aprovecha! → ¡Aproveche!
  * ¡Elegí!/¡Elige! → ¡Elija! | ¡Descubrí!/¡Descubre! → ¡Descubra!
  * ¡Conocé!/¡Conoce! → ¡Conozca! | ¡Pedí!/¡Pide! → ¡Solicite!
  * Formas institucionales: Contáctenos, Visítenos, Consúltenos, Infórmese
- Complementos: te → le | te lo/te la → se lo/se la

CONTEXTO COSTARRICENSE:
- Formal (banca, salud, gobierno, seguros): tono profesional, distante y confiable
- Íntimo costarricense (parejas/familia): cálido pero siempre con "usted"

ESTILO PUBLICITARIO:
- Transmite confianza, solidez y seriedad institucional
- Fórmulas de cortesía: "Le invitamos a…", "Le ofrecemos…", "Para usted…"
- CTAs elegantes: "Descubra", "Conozca nuestros servicios", "Solicite su consulta"
- Preserva el tono solemne y la dignidad adecuada para el sector objetivo
- Cuida la ortografía general: tildes, puntuación y mayúsculas correctas
`;

      default:
        return '';
    }
  }

  private buildCopySystemPrompt(cfg: CopyConfig): string {
    const TRATAMIENTO_LABEL: Record<string, string> = {
      voseo: 'voseo costarricense ("vos", vos tenés, vos querés, imperativo: \u00a1Prová!, \u00a1Comprá!)',
      tuteo: 'tuteo latinoamericano ("tú", tú tienes, tú quieres, imperativo: \u00a1Prueba!, \u00a1Compra!)',
      ustedeo: 'ustedeo formal/íntimo costarricense ("usted", imperativo subjuntivo: \u00a1Pruebe!, \u00a1Compre!)',
    };
    const CONTEXTO_LABEL: Record<string, string> = {
      boton: 'texto de botón o CTA (máx. 4 palabras, acción directa)',
      formulario: 'etiqueta o placeholder de formulario (claro, conciso, sin jerga)',
      error: 'mensaje de error amigable (empatía + solución)',
      landing: 'texto de landing page (encabezado, subencabezado o cuerpo persuasivo)',
      anuncio: 'copy publicitario (anuncio, banner o post en redes sociales)',
      notificacion: 'notificación push/in-app (breve, relevante, accionable)',
    };
    const OBJETIVO_LABEL: Record<string, string> = {
      informar: 'informar (claro, preciso, sin adornos)',
      convertir: 'convertir (urgencia, beneficio claro, CTA fuerte)',
      guiar: 'guiar al usuario (instrucciones simples, orientadas a la acción)',
      persuadir: 'persuadir (beneficio emocional, confianza, deseo)',
    };
    const FORMALIDAD_LABEL: Record<string, string> = {
      alto: 'formal y profesional',
      medio: 'cercano pero respetuoso',
      bajo: 'informal, fresco y coloquial',
    };
    const INTENSIDAD_LABEL: Record<string, string> = {
      minima: 'mínima (ajusta solo lo imprescindible, conserva al máximo el original)',
      moderada: 'moderada (reescribe libremente pero mantiene el mensaje clave)',
      alta: 'alta (reescribe con completa libertad creativa para maximizar impacto)',
    };

    const tratamiento = TRATAMIENTO_LABEL[cfg.tratamiento] ?? cfg.tratamiento;
    const contexto = CONTEXTO_LABEL[cfg.contexto] ?? cfg.contexto;
    const objetivo = OBJETIVO_LABEL[cfg.objetivo] ?? cfg.objetivo;
    const formalidad = FORMALIDAD_LABEL[cfg.formalidad] ?? cfg.formalidad;
    const intensidad = INTENSIDAD_LABEL[cfg.intensidadCambio] ?? cfg.intensidadCambio;
    const canal = cfg.canal ? `\nCanal de distribución: ${cfg.canal}` : '';
    const modoVerbal = cfg.modoVerbal === 'imperativo'
      ? '\nUsa formas imperativas directas para CTAs y llamadas a la acción.'
      : '';
    const limiteInfo = cfg.limiteLongitud
      ? `\nLímite de longitud: máximo ${cfg.limiteLongitud} caracteres.`
      : '';
    const obligatorios = cfg.terminosObligatorios?.length
      ? `\nTérminos OBLIGATORIOS que deben aparecer en el resultado: ${cfg.terminosObligatorios.join(', ')}`
      : '';
    const prohibidos = cfg.terminosProhibidos?.length
      ? `\nTérminos PROHIBIDOS que no deben aparecer bajo ningún concepto: ${cfg.terminosProhibidos.join(', ')}`
      : '';

    return `
Eres un experto en copywriting publicitario y UX Writing para el mercado costarricense.

CONFIGURACIÓN ACTIVA:
- Tratamiento gramatical: ${tratamiento}
- Contexto del texto: ${contexto}
- Objetivo de comunicación: ${objetivo}
- Nivel de formalidad: ${formalidad}
- Intensidad de cambio: ${intensidad}${canal}${modoVerbal}${limiteInfo}${obligatorios}${prohibidos}

REGLA ABSOLUTA más importante:
Devuelve ÚNICAMENTE el texto final optimizado.
NO incluyas explicaciones, alternativas, secciones, encabezados, validaciones, bullets, ni ningún tipo de metacomentario.
Si el input tiene múltiples líneas o elementos, entregálos todos optimizados en el mismo orden y formato.

PRINCIPIOS DE COPYWRITING CR:
1. Claridad ante todo: el mensaje debe entenderse en un vistazo
2. Beneficio explícito: qué gana el usuario, no qué hace el producto
3. Urgencia natural: sin manipulación, con razón real de actuar ahora
4. Voz activa siempre: el sujeto actúa, no recibe la acción
5. Concordancia gramatical: género, número y tratamiento 100% consistentes
6. Ortografía perfecta: tildes, puntuación y mayúsculas según la RAE
7. Autenticidad tica: si el contexto lo permite, usa expresiones naturales de Costa Rica
`;
  }
}
