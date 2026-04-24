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
  // ── Highly Irregular ─────────────────────────────────────────────────────
  { infinitive: 'ser',        voseo: 'sos',       tuteo: 'eres',      ustedeo: 'es',       isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // estar: identical in tuteo and ustedeo
  { infinitive: 'estar',      voseo: 'estás',     tuteo: 'estás',     ustedeo: 'está',     voseoImperative: 'está',     tuteoImperative: 'está',      ustedeoImperative: 'esté',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ar' },
  // haber
  { infinitive: 'haber',      voseo: 'habés',     tuteo: 'has',       ustedeo: 'ha',       isIrregular: true,  isDiphthongating: false, conjugationGroup: '-er' },
  // ir: identical in voseo and tuteo
  { infinitive: 'ir',         voseo: 'vas',       tuteo: 'vas',       ustedeo: 'va',       voseoImperative: 'andá',     tuteoImperative: 've',        ustedeoImperative: 'vaya',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ir' },
  // dar: identical in voseo and tuteo
  { infinitive: 'dar',        voseo: 'das',       tuteo: 'das',       ustedeo: 'da',       voseoImperative: 'dá',       tuteoImperative: 'da',        ustedeoImperative: 'dé',       isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ar' },

  // ── Marketing digital ────────────────────────────────────────────────────
  { infinitive: 'ahorrar',      voseo: 'ahorrás',      tuteo: 'ahorras',      ustedeo: 'ahorra',      voseoImperative: 'ahorrá',      tuteoImperative: 'ahorra',       ustedeoImperative: 'ahorre',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'aprovechar',   voseo: 'aprovechás',   tuteo: 'aprovechas',   ustedeo: 'aprovecha',   voseoImperative: 'aprovechá',   tuteoImperative: 'aprovecha',    ustedeoImperative: 'aproveche',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'descubrir',    voseo: 'descubrís',    tuteo: 'descubres',    ustedeo: 'descubre',    voseoImperative: 'descubrí',    tuteoImperative: 'descubre',     ustedeoImperative: 'descubra',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'explorar',     voseo: 'explorás',     tuteo: 'exploras',     ustedeo: 'explora',     voseoImperative: 'explorá',     tuteoImperative: 'explora',      ustedeoImperative: 'explore',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'disfrutar',    voseo: 'disfrutás',    tuteo: 'disfrutas',    ustedeo: 'disfruta',    voseoImperative: 'disfrutá',    tuteoImperative: 'disfruta',     ustedeoImperative: 'disfrute',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'conectar',     voseo: 'conectás',     tuteo: 'conectas',     ustedeo: 'conecta',     voseoImperative: 'conectá',     tuteoImperative: 'conecta',      ustedeoImperative: 'conecte',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'compartir',    voseo: 'compartís',    tuteo: 'compartes',    ustedeo: 'comparte',    voseoImperative: 'compartí',    tuteoImperative: 'comparte',     ustedeoImperative: 'comparta',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'crear',        voseo: 'creás',        tuteo: 'creas',        ustedeo: 'crea',        voseoImperative: 'creá',        tuteoImperative: 'crea',         ustedeoImperative: 'cree',         isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'diseñar',      voseo: 'diseñás',      tuteo: 'diseñas',      ustedeo: 'diseña',      voseoImperative: 'diseñá',      tuteoImperative: 'diseña',       ustedeoImperative: 'diseñe',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'desarrollar',  voseo: 'desarrollás',  tuteo: 'desarrollas',  ustedeo: 'desarrolla',  voseoImperative: 'desarrollá',  tuteoImperative: 'desarrolla',   ustedeoImperative: 'desarrolle',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'mejorar',      voseo: 'mejorás',      tuteo: 'mejoras',      ustedeo: 'mejora',      voseoImperative: 'mejorá',      tuteoImperative: 'mejora',       ustedeoImperative: 'mejore',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'optimizar',    voseo: 'optimizás',    tuteo: 'optimizas',    ustedeo: 'optimiza',    voseoImperative: 'optimizá',    tuteoImperative: 'optimiza',     ustedeoImperative: 'optimice',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'transformar',  voseo: 'transformás',  tuteo: 'transformas',  ustedeo: 'transforma',  voseoImperative: 'transformá',  tuteoImperative: 'transforma',   ustedeoImperative: 'transforme',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'innovar',      voseo: 'innovás',      tuteo: 'innovas',      ustedeo: 'innova',      voseoImperative: 'innová',      tuteoImperative: 'innova',       ustedeoImperative: 'innove',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'liderar',      voseo: 'liderás',      tuteo: 'lideras',      ustedeo: 'lidera',      voseoImperative: 'liderá',      tuteoImperative: 'lidera',       ustedeoImperative: 'lidere',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'crecer',       voseo: 'crecés',       tuteo: 'creces',       ustedeo: 'crece',       voseoImperative: 'crecé',       tuteoImperative: 'crece',        ustedeoImperative: 'crezca',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },

  // ── E-commerce / conversión ───────────────────────────────────────────────
  { infinitive: 'pagar',        voseo: 'pagás',        tuteo: 'pagas',        ustedeo: 'paga',        voseoImperative: 'pagá',        tuteoImperative: 'paga',         ustedeoImperative: 'pague',        isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'registrar',    voseo: 'registrás',    tuteo: 'registras',    ustedeo: 'registra',    voseoImperative: 'registrá',    tuteoImperative: 'registra',     ustedeoImperative: 'registre',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'suscribir',    voseo: 'suscribís',    tuteo: 'suscribes',    ustedeo: 'suscribe',    voseoImperative: 'suscribí',    tuteoImperative: 'suscribe',     ustedeoImperative: 'suscriba',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'descargar',    voseo: 'descargás',    tuteo: 'descargas',    ustedeo: 'descarga',    voseoImperative: 'descargá',    tuteoImperative: 'descarga',     ustedeoImperative: 'descargue',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'instalar',     voseo: 'instalás',     tuteo: 'instalas',     ustedeo: 'instala',     voseoImperative: 'instalá',     tuteoImperative: 'instala',      ustedeoImperative: 'instale',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'activar',      voseo: 'activás',      tuteo: 'activas',      ustedeo: 'activa',      voseoImperative: 'activá',      tuteoImperative: 'activa',       ustedeoImperative: 'active',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'acceder',      voseo: 'accedés',      tuteo: 'accedes',      ustedeo: 'accede',      voseoImperative: 'accedé',      tuteoImperative: 'accede',       ustedeoImperative: 'acceda',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'iniciar',      voseo: 'iniciás',      tuteo: 'inicias',      ustedeo: 'inicia',      voseoImperative: 'iniciá',      tuteoImperative: 'inicia',       ustedeoImperative: 'inicie',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'confirmar',    voseo: 'confirmás',    tuteo: 'confirmas',    ustedeo: 'confirma',    voseoImperative: 'confirmá',    tuteoImperative: 'confirma',     ustedeoImperative: 'confirme',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'verificar',    voseo: 'verificás',    tuteo: 'verificas',    ustedeo: 'verifica',    voseoImperative: 'verificá',    tuteoImperative: 'verifica',     ustedeoImperative: 'verifique',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'actualizar',   voseo: 'actualizás',   tuteo: 'actualizas',   ustedeo: 'actualiza',   voseoImperative: 'actualizá',   tuteoImperative: 'actualiza',    ustedeoImperative: 'actualice',    isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'cancelar',     voseo: 'cancelás',     tuteo: 'cancelas',     ustedeo: 'cancela',     voseoImperative: 'cancelá',     tuteoImperative: 'cancela',      ustedeoImperative: 'cancele',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'renovar',      voseo: 'renovás',      tuteo: 'renuevas',     ustedeo: 'renueva',     voseoImperative: 'renová',      tuteoImperative: 'renueva',      ustedeoImperative: 'renueve',      isIrregular: false, isDiphthongating: true,  conjugationGroup: '-ar' },
  { infinitive: 'reservar',     voseo: 'reservás',     tuteo: 'reservas',     ustedeo: 'reserva',     voseoImperative: 'reservá',     tuteoImperative: 'reserva',      ustedeoImperative: 'reserve',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'contratar',    voseo: 'contratás',    tuteo: 'contratas',    ustedeo: 'contrata',    voseoImperative: 'contratá',    tuteoImperative: 'contrata',     ustedeoImperative: 'contrate',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'solicitar',    voseo: 'solicitás',    tuteo: 'solicitas',    ustedeo: 'solicita',    voseoImperative: 'solicitá',    tuteoImperative: 'solicita',     ustedeoImperative: 'solicite',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'agregar',      voseo: 'agregás',      tuteo: 'agregas',      ustedeo: 'agrega',      voseoImperative: 'agregá',      tuteoImperative: 'agrega',       ustedeoImperative: 'agregue',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'eliminar',     voseo: 'eliminás',     tuteo: 'eliminas',     ustedeo: 'elimina',     voseoImperative: 'eliminá',     tuteoImperative: 'elimina',      ustedeoImperative: 'elimine',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },

  // ── Acción / CTA ─────────────────────────────────────────────────────────
  { infinitive: 'intentar',     voseo: 'intentás',     tuteo: 'intentas',     ustedeo: 'intenta',     voseoImperative: 'intentá',     tuteoImperative: 'intenta',      ustedeoImperative: 'intente',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'lograr',       voseo: 'lográs',       tuteo: 'logras',       ustedeo: 'logra',       voseoImperative: 'lográ',       tuteoImperative: 'logra',        ustedeoImperative: 'logre',        isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'conseguir',    voseo: 'conseguís',    tuteo: 'consigues',    ustedeo: 'consigue',    voseoImperative: 'conseguí',    tuteoImperative: 'consigue',     ustedeoImperative: 'consiga',      isIrregular: false, isDiphthongating: true,  conjugationGroup: '-ir' },
  { infinitive: 'obtener',      voseo: 'obtenés',      tuteo: 'obtienes',     ustedeo: 'obtiene',     voseoImperative: 'obtené',      tuteoImperative: 'obtén',        ustedeoImperative: 'obtenga',      isIrregular: true,  isDiphthongating: true,  conjugationGroup: '-er' },
  { infinitive: 'aceptar',      voseo: 'aceptás',      tuteo: 'aceptas',      ustedeo: 'acepta',      voseoImperative: 'aceptá',      tuteoImperative: 'acepta',       ustedeoImperative: 'acepte',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'seleccionar',  voseo: 'seleccionás',  tuteo: 'seleccionas',  ustedeo: 'selecciona',  voseoImperative: 'seleccioná',  tuteoImperative: 'selecciona',   ustedeoImperative: 'seleccione',   isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'comparar',     voseo: 'comparás',     tuteo: 'comparas',     ustedeo: 'compara',     voseoImperative: 'compará',     tuteoImperative: 'compara',      ustedeoImperative: 'compare',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'calcular',     voseo: 'calculás',     tuteo: 'calculas',     ustedeo: 'calcula',     voseoImperative: 'calculá',     tuteoImperative: 'calcula',      ustedeoImperative: 'calcule',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'enviar',       voseo: 'enviás',       tuteo: 'envías',       ustedeo: 'envía',       voseoImperative: 'enviá',       tuteoImperative: 'envía',        ustedeoImperative: 'envíe',        isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'entregar',     voseo: 'entregás',     tuteo: 'entregas',     ustedeo: 'entrega',     voseoImperative: 'entregá',     tuteoImperative: 'entrega',      ustedeoImperative: 'entregue',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'consultar',    voseo: 'consultás',    tuteo: 'consultas',    ustedeo: 'consulta',    voseoImperative: 'consultá',    tuteoImperative: 'consulta',     ustedeoImperative: 'consulte',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'contactar',    voseo: 'contactás',    tuteo: 'contactas',    ustedeo: 'contacta',    voseoImperative: 'contactá',    tuteoImperative: 'contacta',     ustedeoImperative: 'contacte',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'visitar',      voseo: 'visitás',      tuteo: 'visitas',      ustedeo: 'visita',      voseoImperative: 'visitá',      tuteoImperative: 'visita',       ustedeoImperative: 'visite',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'aprender',     voseo: 'aprendés',     tuteo: 'aprendes',     ustedeo: 'aprende',     voseoImperative: 'aprendé',     tuteoImperative: 'aprende',      ustedeoImperative: 'aprenda',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-er' },
  { infinitive: 'evaluar',      voseo: 'evaluás',      tuteo: 'evalúas',      ustedeo: 'evalúa',      voseoImperative: 'evaluá',      tuteoImperative: 'evalúa',       ustedeoImperative: 'evalúe',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },

  // ── Verbos comunes adicionales ────────────────────────────────────────────
  { infinitive: 'amar',         voseo: 'amás',         tuteo: 'amas',         ustedeo: 'ama',         voseoImperative: 'amá',         tuteoImperative: 'ama',          ustedeoImperative: 'ame',          isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'soñar',        voseo: 'soñás',        tuteo: 'sueñas',       ustedeo: 'sueña',       voseoImperative: 'soñá',        tuteoImperative: 'sueña',        ustedeoImperative: 'sueñe',        isIrregular: false, isDiphthongating: true,  conjugationGroup: '-ar' },
  { infinitive: 'imaginar',     voseo: 'imaginás',     tuteo: 'imaginas',     ustedeo: 'imagina',     voseoImperative: 'imaginá',     tuteoImperative: 'imagina',      ustedeoImperative: 'imagine',      isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'construir',    voseo: 'construís',    tuteo: 'construyes',   ustedeo: 'construye',   voseoImperative: 'construí',    tuteoImperative: 'construye',    ustedeoImperative: 'construya',    isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'manejar',      voseo: 'manejás',      tuteo: 'manejas',      ustedeo: 'maneja',      voseoImperative: 'manejá',      tuteoImperative: 'maneja',       ustedeoImperative: 'maneje',       isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'conducir',     voseo: 'conducís',     tuteo: 'conduces',     ustedeo: 'conduce',     voseoImperative: 'conducí',     tuteoImperative: 'conduce',      ustedeoImperative: 'conduzca',     isIrregular: true,  isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'viajar',       voseo: 'viajás',       tuteo: 'viajas',       ustedeo: 'viaja',       voseoImperative: 'viajá',       tuteoImperative: 'viaja',        ustedeoImperative: 'viaje',        isIrregular: false, isDiphthongating: false, conjugationGroup: '-ar' },
  { infinitive: 'inscribir',    voseo: 'inscribís',    tuteo: 'inscribes',    ustedeo: 'inscribe',    voseoImperative: 'inscribí',    tuteoImperative: 'inscribe',     ustedeoImperative: 'inscriba',     isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
  { infinitive: 'unir',         voseo: 'unís',         tuteo: 'unes',         ustedeo: 'une',         voseoImperative: 'uní',         tuteoImperative: 'une',          ustedeoImperative: 'una',          isIrregular: false, isDiphthongating: false, conjugationGroup: '-ir' },
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

/**
 * Maps keyed by imperative forms (for detecting already-imperative source text).
 * When a verb has no imperative form, the entry is simply not included.
 */
function buildImperativeMap(getter: (e: VerbEntry) => string | undefined): Map<string, VerbEntry> {
  const map = new Map<string, VerbEntry>();
  for (const entry of VERB_MAPPINGS) {
    const key = getter(entry)?.toLowerCase();
    if (key && !map.has(key)) {
      map.set(key, entry);
    }
  }
  return map;
}

export const VERB_BY_VOSEO_IMP: Map<string, VerbEntry> = buildImperativeMap((e) => e.voseoImperative);
export const VERB_BY_TUTEO_IMP: Map<string, VerbEntry> = buildImperativeMap((e) => e.tuteoImperative);
export const VERB_BY_USTEDEO_IMP: Map<string, VerbEntry> = buildImperativeMap((e) => e.ustedeoImperative);
