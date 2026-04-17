export type ConjugationGroup = '-ar' | '-er' | '-ir';

export interface VerbEntry {
  infinitive: string;
  voseo: string;
  tuteo: string;
  ustedeo: string;
  voseoImperative?: string;
  tuteoImperative?: string;
  ustedeoImperative?: string;
  isIrregular: boolean;
  isDiphthongating: boolean;
  conjugationGroup: ConjugationGroup;
}

export const VERB_MAPPINGS: VerbEntry[] = [
  // ── Regular -AR ──────────────────────────────────────────────────────────────
  { infinitive: 'hablar',     voseo: 'hablás',    tuteo: 'hablas',    ustedeo: 'habla',    voseoImperative: 'hablá',    tuteoImperative: 'habla',    ustedeoImperative: 'hable',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'caminar',    voseo: 'caminás',   tuteo: 'caminas',   ustedeo: 'camina',   voseoImperative: 'caminá',   tuteoImperative: 'camina',   ustedeoImperative: 'camine',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'trabajar',   voseo: 'trabajás',  tuteo: 'trabajas',  ustedeo: 'trabaja',  voseoImperative: 'trabajá',  tuteoImperative: 'trabaja',  ustedeoImperative: 'trabaje',  isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'llegar',     voseo: 'llegás',    tuteo: 'llegas',    ustedeo: 'llega',    voseoImperative: 'llegá',    tuteoImperative: 'llega',    ustedeoImperative: 'llegue',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'llamar',     voseo: 'llamás',    tuteo: 'llamas',    ustedeo: 'llama',    voseoImperative: 'llamá',    tuteoImperative: 'llama',    ustedeoImperative: 'llame',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'comprar',    voseo: 'comprás',   tuteo: 'compras',   ustedeo: 'compra',   voseoImperative: 'comprá',   tuteoImperative: 'compra',   ustedeoImperative: 'compre',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'tomar',      voseo: 'tomás',     tuteo: 'tomas',     ustedeo: 'toma',     voseoImperative: 'tomá',     tuteoImperative: 'toma',     ustedeoImperative: 'tome',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'usar',       voseo: 'usás',      tuteo: 'usas',      ustedeo: 'usa',      voseoImperative: 'usá',      tuteoImperative: 'usa',      ustedeoImperative: 'use',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'esperar',    voseo: 'esperás',   tuteo: 'esperas',   ustedeo: 'espera',   voseoImperative: 'esperá',   tuteoImperative: 'espera',   ustedeoImperative: 'espere',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'necesitar',  voseo: 'necesitás', tuteo: 'necesitas', ustedeo: 'necesita', voseoImperative: 'necesitá', tuteoImperative: 'necesita', ustedeoImperative: 'necesite', isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'preguntar',  voseo: 'preguntás', tuteo: 'preguntas', ustedeo: 'pregunta', voseoImperative: 'preguntá', tuteoImperative: 'pregunta', ustedeoImperative: 'pregunte', isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'olvidar',    voseo: 'olvidás',   tuteo: 'olvidas',   ustedeo: 'olvida',   voseoImperative: 'olvidá',   tuteoImperative: 'olvida',   ustedeoImperative: 'olvide',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'ayudar',     voseo: 'ayudás',    tuteo: 'ayudas',    ustedeo: 'ayuda',    voseoImperative: 'ayudá',    tuteoImperative: 'ayuda',    ustedeoImperative: 'ayude',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'escuchar',   voseo: 'escuchás',  tuteo: 'escuchas',  ustedeo: 'escucha',  voseoImperative: 'escuchá',  tuteoImperative: 'escucha',  ustedeoImperative: 'escuche',  isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'mirar',      voseo: 'mirás',     tuteo: 'miras',     ustedeo: 'mira',     voseoImperative: 'mirá',     tuteoImperative: 'mira',     ustedeoImperative: 'mire',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'pasar',      voseo: 'pasás',     tuteo: 'pasas',     ustedeo: 'pasa',     voseoImperative: 'pasá',     tuteoImperative: 'pasa',     ustedeoImperative: 'pase',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'entrar',     voseo: 'entrás',    tuteo: 'entras',    ustedeo: 'entra',    voseoImperative: 'entrá',    tuteoImperative: 'entra',    ustedeoImperative: 'entre',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'ganar',      voseo: 'ganás',     tuteo: 'ganas',     ustedeo: 'gana',     voseoImperative: 'ganá',     tuteoImperative: 'gana',     ustedeoImperative: 'gane',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'dejar',      voseo: 'dejás',     tuteo: 'dejas',     ustedeo: 'deja',     voseoImperative: 'dejá',     tuteoImperative: 'deja',     ustedeoImperative: 'deje',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'esperar',    voseo: 'esperás',   tuteo: 'esperas',   ustedeo: 'espera',   voseoImperative: 'esperá',   tuteoImperative: 'espera',   ustedeoImperative: 'espere',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'buscar',     voseo: 'buscás',    tuteo: 'buscas',    ustedeo: 'busca',    voseoImperative: 'buscá',    tuteoImperative: 'busca',    ustedeoImperative: 'busque',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'guardar',    voseo: 'guardás',   tuteo: 'guardas',   ustedeo: 'guarda',   voseoImperative: 'guardá',   tuteoImperative: 'guarda',   ustedeoImperative: 'guarde',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'bajar',      voseo: 'bajás',     tuteo: 'bajas',     ustedeo: 'baja',     voseoImperative: 'bajá',     tuteoImperative: 'baja',     ustedeoImperative: 'baje',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'subir',      voseo: 'subís',     tuteo: 'subes',     ustedeo: 'sube',     voseoImperative: 'subí',     tuteoImperative: 'sube',     ustedeoImperative: 'suba',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  // ── Diphthongating -AR (o→ue in tuteo/ustedeo, no diphthong in voseo) ────────
  { infinitive: 'encontrar',  voseo: 'encontrás', tuteo: 'encuentras', ustedeo: 'encuentra', voseoImperative: 'encontrá', tuteoImperative: 'encuentra', ustedeoImperative: 'encuentre', isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'contar',     voseo: 'contás',    tuteo: 'cuentas',   ustedeo: 'cuenta',   voseoImperative: 'contá',    tuteoImperative: 'cuenta',    ustedeoImperative: 'cuente',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'mostrar',    voseo: 'mostrás',   tuteo: 'muestras',  ustedeo: 'muestra',  voseoImperative: 'mostrá',   tuteoImperative: 'muestra',   ustedeoImperative: 'muestre',  isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'recordar',   voseo: 'recordás',  tuteo: 'recuerdas', ustedeo: 'recuerda', voseoImperative: 'recordá',  tuteoImperative: 'recuerda',  ustedeoImperative: 'recuerde', isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'probar',     voseo: 'probás',    tuteo: 'pruebas',   ustedeo: 'prueba',   voseoImperative: 'probá',    tuteoImperative: 'prueba',    ustedeoImperative: 'pruebe',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'volar',      voseo: 'volás',     tuteo: 'vuelas',    ustedeo: 'vuela',    voseoImperative: 'volá',     tuteoImperative: 'vuela',     ustedeoImperative: 'vuele',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'costar',     voseo: 'costás',    tuteo: 'cuestas',   ustedeo: 'cuesta',   voseoImperative: 'costá',    tuteoImperative: 'cuesta',    ustedeoImperative: 'cueste',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'acostar',    voseo: 'acostás',   tuteo: 'acuestas',  ustedeo: 'acuesta',  voseoImperative: 'acostá',   tuteoImperative: 'acuesta',   ustedeoImperative: 'acueste',  isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  // ── Diphthongating -AR (e→ie in tuteo/ustedeo) ──────────────────────────────
  { infinitive: 'pensar',     voseo: 'pensás',    tuteo: 'piensas',   ustedeo: 'piensa',   voseoImperative: 'pensá',    tuteoImperative: 'piensa',    ustedeoImperative: 'piense',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'cerrar',     voseo: 'cerrás',    tuteo: 'cierras',   ustedeo: 'cierra',   voseoImperative: 'cerrá',    tuteoImperative: 'cierra',    ustedeoImperative: 'cierre',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'empezar',    voseo: 'empezás',   tuteo: 'empiezas',  ustedeo: 'empieza',  voseoImperative: 'empezá',   tuteoImperative: 'empieza',   ustedeoImperative: 'empiece',  isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'comenzar',   voseo: 'comenzás',  tuteo: 'comienzas', ustedeo: 'comienza', voseoImperative: 'comenzá',  tuteoImperative: 'comienza',  ustedeoImperative: 'comience', isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'despertar',  voseo: 'despertás', tuteo: 'despiertas',ustedeo: 'despierta',voseoImperative: 'despertá', tuteoImperative: 'despierta', ustedeoImperative: 'despierte', isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  { infinitive: 'sentar',     voseo: 'sentás',    tuteo: 'sientas',   ustedeo: 'sienta',   voseoImperative: 'sentá',    tuteoImperative: 'sienta',    ustedeoImperative: 'siente',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ar' },
  // ── Regular -ER ──────────────────────────────────────────────────────────────
  { infinitive: 'comer',      voseo: 'comés',     tuteo: 'comes',     ustedeo: 'come',     voseoImperative: 'comé',     tuteoImperative: 'come',      ustedeoImperative: 'coma',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'beber',      voseo: 'bebés',     tuteo: 'bebes',     ustedeo: 'bebe',     voseoImperative: 'bebé',     tuteoImperative: 'bebe',      ustedeoImperative: 'beba',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'leer',       voseo: 'leés',      tuteo: 'lees',      ustedeo: 'lee',      voseoImperative: 'leé',      tuteoImperative: 'lee',       ustedeoImperative: 'lea',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'correr',     voseo: 'corrés',    tuteo: 'corres',    ustedeo: 'corre',    voseoImperative: 'corré',    tuteoImperative: 'corre',     ustedeoImperative: 'corra',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'vender',     voseo: 'vendés',    tuteo: 'vendes',    ustedeo: 'vende',    voseoImperative: 'vendé',    tuteoImperative: 'vende',     ustedeoImperative: 'venda',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'depender',   voseo: 'dependés',  tuteo: 'dependes',  ustedeo: 'depende',  voseoImperative: 'dependé',  tuteoImperative: 'depende',   ustedeoImperative: 'dependa',  isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'romper',     voseo: 'rompés',    tuteo: 'rompes',    ustedeo: 'rompe',    voseoImperative: 'rompé',    tuteoImperative: 'rompe',     ustedeoImperative: 'rompa',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'conocer',    voseo: 'conocés',   tuteo: 'conoces',   ustedeo: 'conoce',   voseoImperative: 'conocé',   tuteoImperative: 'conoce',    ustedeoImperative: 'conozca',  isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'parecer',    voseo: 'parecés',   tuteo: 'pareces',   ustedeo: 'parece',   voseoImperative: 'parecé',   tuteoImperative: 'parece',    ustedeoImperative: 'parezca',  isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'creer',      voseo: 'creés',     tuteo: 'crees',     ustedeo: 'cree',     voseoImperative: 'creé',     tuteoImperative: 'cree',      ustedeoImperative: 'crea',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'traer',      voseo: 'traés',     tuteo: 'traes',     ustedeo: 'trae',     voseoImperative: 'traé',     tuteoImperative: 'trae',      ustedeoImperative: 'traiga',   isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'caer',       voseo: 'caés',      tuteo: 'caes',      ustedeo: 'cae',      voseoImperative: 'caé',      tuteoImperative: 'cae',       ustedeoImperative: 'caiga',    isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // ── Diphthongating -ER (o→ue) ────────────────────────────────────────────────
  { infinitive: 'poder',      voseo: 'podés',     tuteo: 'puedes',    ustedeo: 'puede',    voseoImperative: 'podé',     tuteoImperative: 'puede',     ustedeoImperative: 'pueda',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'volver',     voseo: 'volvés',    tuteo: 'vuelves',   ustedeo: 'vuelve',   voseoImperative: 'volvé',    tuteoImperative: 'vuelve',    ustedeoImperative: 'vuelva',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'mover',      voseo: 'movés',     tuteo: 'mueves',    ustedeo: 'mueve',    voseoImperative: 'mové',     tuteoImperative: 'mueve',     ustedeoImperative: 'mueva',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'resolver',   voseo: 'resolvés',  tuteo: 'resuelves', ustedeo: 'resuelve', voseoImperative: 'resolvé',  tuteoImperative: 'resuelve',  ustedeoImperative: 'resuelva', isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'devolver',   voseo: 'devolvés',  tuteo: 'devuelves', ustedeo: 'devuelve', voseoImperative: 'devolvé',  tuteoImperative: 'devuelve',  ustedeoImperative: 'devuelva', isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'doler',      voseo: 'dolés',     tuteo: 'dueles',    ustedeo: 'duele',    voseoImperative: 'dolé',     tuteoImperative: 'duele',     ustedeoImperative: 'duela',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'oler',       voseo: 'olés',      tuteo: 'hueles',    ustedeo: 'huele',    voseoImperative: 'olé',      tuteoImperative: 'huele',     ustedeoImperative: 'huela',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  // ── Diphthongating -ER (e→ie) ────────────────────────────────────────────────
  { infinitive: 'tener',      voseo: 'tenés',     tuteo: 'tienes',    ustedeo: 'tiene',    voseoImperative: 'tené',     tuteoImperative: 'ten',       ustedeoImperative: 'tenga',    isIrregular: true,  isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'querer',     voseo: 'querés',    tuteo: 'quieres',   ustedeo: 'quiere',   voseoImperative: 'queré',    tuteoImperative: 'quiere',    ustedeoImperative: 'quiera',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'entender',   voseo: 'entendés',  tuteo: 'entiendes', ustedeo: 'entiende', voseoImperative: 'entendé',  tuteoImperative: 'entiende',  ustedeoImperative: 'entienda', isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'defender',   voseo: 'defendés',  tuteo: 'defiendes', ustedeo: 'defiende', voseoImperative: 'defendé',  tuteoImperative: 'defiende',  ustedeoImperative: 'defienda', isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'perder',     voseo: 'perdés',    tuteo: 'pierdes',   ustedeo: 'pierde',   voseoImperative: 'perdé',    tuteoImperative: 'pierde',    ustedeoImperative: 'pierda',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  { infinitive: 'encender',   voseo: 'encendés',  tuteo: 'enciendes', ustedeo: 'enciende', voseoImperative: 'encendé',  tuteoImperative: 'enciende',  ustedeoImperative: 'encienda', isIrregular: false, isDiphthongating: true, conjugationGroup: '-er' },
  // ── Irregular -ER ────────────────────────────────────────────────────────────
  { infinitive: 'hacer',      voseo: 'hacés',     tuteo: 'haces',     ustedeo: 'hace',     voseoImperative: 'hacé',     tuteoImperative: 'haz',       ustedeoImperative: 'haga',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'saber',      voseo: 'sabés',     tuteo: 'sabes',     ustedeo: 'sabe',     voseoImperative: 'sabé',     tuteoImperative: 'sabe',      ustedeoImperative: 'sepa',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'poner',      voseo: 'ponés',     tuteo: 'pones',     ustedeo: 'pone',     voseoImperative: 'poné',     tuteoImperative: 'pon',       ustedeoImperative: 'ponga',    isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // ver: voseo = "ves" (no accent, irregular — standard -ás pattern does NOT apply)
  { infinitive: 'ver',        voseo: 'ves',       tuteo: 'ves',       ustedeo: 've',       voseoImperative: 've',       tuteoImperative: 've',        ustedeoImperative: 'vea',      isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // ── Regular -IR ──────────────────────────────────────────────────────────────
  { infinitive: 'vivir',      voseo: 'vivís',     tuteo: 'vives',     ustedeo: 'vive',     voseoImperative: 'viví',     tuteoImperative: 'vive',      ustedeoImperative: 'viva',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'escribir',   voseo: 'escribís',  tuteo: 'escribes',  ustedeo: 'escribe',  voseoImperative: 'escribí',  tuteoImperative: 'escribe',   ustedeoImperative: 'escriba',  isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'abrir',      voseo: 'abrís',     tuteo: 'abres',     ustedeo: 'abre',     voseoImperative: 'abrí',     tuteoImperative: 'abre',      ustedeoImperative: 'abra',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'recibir',    voseo: 'recibís',   tuteo: 'recibes',   ustedeo: 'recibe',   voseoImperative: 'recibí',   tuteoImperative: 'recibe',    ustedeoImperative: 'reciba',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  // ── Stem-changing -IR (e→i) ──────────────────────────────────────────────────
  { infinitive: 'seguir',     voseo: 'seguís',    tuteo: 'sigues',    ustedeo: 'sigue',    voseoImperative: 'seguí',    tuteoImperative: 'sigue',     ustedeoImperative: 'siga',     isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'pedir',      voseo: 'pedís',     tuteo: 'pides',     ustedeo: 'pide',     voseoImperative: 'pedí',     tuteoImperative: 'pide',      ustedeoImperative: 'pida',     isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'servir',     voseo: 'servís',    tuteo: 'sirves',    ustedeo: 'sirve',    voseoImperative: 'serví',    tuteoImperative: 'sirve',     ustedeoImperative: 'sirva',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'elegir',     voseo: 'elegís',    tuteo: 'eliges',    ustedeo: 'elige',    voseoImperative: 'elegí',    tuteoImperative: 'elige',     ustedeoImperative: 'elija',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'repetir',    voseo: 'repetís',   tuteo: 'repites',   ustedeo: 'repite',   voseoImperative: 'repetí',   tuteoImperative: 'repite',    ustedeoImperative: 'repita',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'decir',      voseo: 'decís',     tuteo: 'dices',     ustedeo: 'dice',     voseoImperative: 'decí',     tuteoImperative: 'di',        ustedeoImperative: 'diga',     isIrregular: true,  isDiphthongating: true, conjugationGroup: '-ir' },
  // ── Stem-changing -IR (e→ie) ─────────────────────────────────────────────────
  { infinitive: 'sentir',     voseo: 'sentís',    tuteo: 'sientes',   ustedeo: 'siente',   voseoImperative: 'sentí',    tuteoImperative: 'siente',    ustedeoImperative: 'sienta',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'preferir',   voseo: 'preferís',  tuteo: 'prefieres', ustedeo: 'prefiere', voseoImperative: 'preferí',  tuteoImperative: 'prefiere',  ustedeoImperative: 'prefiera', isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'mentir',     voseo: 'mentís',    tuteo: 'mientes',   ustedeo: 'miente',   voseoImperative: 'mentí',    tuteoImperative: 'miente',    ustedeoImperative: 'mienta',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'hervir',     voseo: 'hervís',    tuteo: 'hierves',   ustedeo: 'hierve',   voseoImperative: 'herví',    tuteoImperative: 'hierve',    ustedeoImperative: 'hierva',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  // ── Stem-changing -IR (o→ue) ─────────────────────────────────────────────────
  { infinitive: 'morir',      voseo: 'morís',     tuteo: 'mueres',    ustedeo: 'muere',    voseoImperative: 'morí',     tuteoImperative: 'muere',     ustedeoImperative: 'muera',    isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  { infinitive: 'dormir',     voseo: 'dormís',    tuteo: 'duermes',   ustedeo: 'duerme',   voseoImperative: 'dormí',    tuteoImperative: 'duerme',    ustedeoImperative: 'duerma',   isIrregular: false, isDiphthongating: true, conjugationGroup: '-ir' },
  // ── Irregular -IR ────────────────────────────────────────────────────────────
  { infinitive: 'salir',      voseo: 'salís',     tuteo: 'sales',     ustedeo: 'sale',     voseoImperative: 'salí',     tuteoImperative: 'sal',       ustedeoImperative: 'salga',    isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'venir',      voseo: 'venís',     tuteo: 'vienes',    ustedeo: 'viene',    voseoImperative: 'vení',     tuteoImperative: 'ven',       ustedeoImperative: 'venga',    isIrregular: true,  isDiphthongating: true, conjugationGroup: '-ir' },
  // ── Highly Irregular ─────────────────────────────────────────────────────────
  { infinitive: 'ser',        voseo: 'sos',       tuteo: 'eres',      ustedeo: 'es',       isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // estar: identical in tuteo and ustedeo
  { infinitive: 'estar',      voseo: 'estás',     tuteo: 'estás',     ustedeo: 'está',     voseoImperative: 'está',     tuteoImperative: 'está',      ustedeoImperative: 'esté',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ar' },
  // haber
  { infinitive: 'haber',      voseo: 'habés',     tuteo: 'has',       ustedeo: 'ha',       isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // ir: identical in voseo and tuteo
  { infinitive: 'ir',         voseo: 'vas',       tuteo: 'vas',       ustedeo: 'va',       voseoImperative: 'andá',     tuteoImperative: 've',        ustedeoImperative: 'vaya',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ir' },
  // dar: identical in voseo and tuteo
  { infinitive: 'dar',        voseo: 'das',       tuteo: 'das',       ustedeo: 'da',       voseoImperative: 'dá',       tuteoImperative: 'da',        ustedeoImperative: 'dé',       isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ar' },
];

/**
 * Builds a Map keyed by a verb form from a given tone getter.
 * When multiple entries share the same form, the first entry wins.
 */
function buildMap(getter: (e: VerbEntry) => string): Map<string, VerbEntry> {
  const map = new Map<string, VerbEntry>();
  for (const entry of VERB_MAPPINGS) {
    const key = getter(entry).toLowerCase();
    if (!map.has(key)) {
      map.set(key, entry);
    }
  }
  return map;
}

export const VERB_BY_VOSEO: Map<string, VerbEntry> = buildMap((e) => e.voseo);
export const VERB_BY_TUTEO: Map<string, VerbEntry> = buildMap((e) => e.tuteo);
export const VERB_BY_USTEDEO: Map<string, VerbEntry> = buildMap((e) => e.ustedeo);
export const VERB_BY_INFINITIVE: Map<string, VerbEntry> = buildMap((e) => e.infinitive);
