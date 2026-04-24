// ── Complete verb conjugation data — Batch 1: 20 highly-irregular verbs ──────
//
// Rules encoded here:
//   • presenteInd.voseo ends in accented vowel + s (-ás/-és/-ís)
//     except: ser→sos, ir/estar/ver/dar have no written accent in voseo.
//   • imperativoPos.voseo = presenteInd.voseo minus the trailing -s
//   • imperativoNeg.voseo = "no " + presenteSubj.voseo
//   • In preterite, imperfect, future, conditional, subjunctive-imperfect:
//     voseo == tuteo form (no separate CR form).
//   • presenteSubj.voseo = tuteo form of present subjunctive (same root).
//
// The adapter `toVerbEntry` lives in verbMappings.ts to avoid a circular import.

import type { CompleteVerbEntry } from './completeVerbEntry';

export const COMPLETE_VERB_MAPPINGS: CompleteVerbEntry[] = [

  // ── ser ─────────────────────────────────────────────────────────────────────
  {
    infinitive: 'ser', gerundio: 'siendo', participio: 'sido',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'soy',    voseo: 'sos',    tuteo: 'eres',   ustedeo: 'es',    el: 'es',    nosotros: 'somos',  ustedes: 'son',    ellos: 'son' },
    preteritoInd:      { yo: 'fui',    voseo: 'fuiste', tuteo: 'fuiste', ustedeo: 'fue',   el: 'fue',   nosotros: 'fuimos', ustedes: 'fueron', ellos: 'fueron' },
    imperfectoInd:     { yo: 'era',    voseo: 'eras',   tuteo: 'eras',   ustedeo: 'era',   el: 'era',   nosotros: 'éramos', ustedes: 'eran',   ellos: 'eran' },
    futuroInd:         { yo: 'seré',   voseo: 'serás',  tuteo: 'serás',  ustedeo: 'será',  el: 'será',  nosotros: 'seremos',ustedes: 'serán',  ellos: 'serán' },
    condicionalInd:    { yo: 'sería',  voseo: 'serías', tuteo: 'serías', ustedeo: 'sería', el: 'sería', nosotros: 'seríamos',ustedes: 'serían', ellos: 'serían' },
    presenteSubj:      { yo: 'sea',    voseo: 'seas',   tuteo: 'seas',   ustedeo: 'sea',   el: 'sea',   nosotros: 'seamos', ustedes: 'sean',   ellos: 'sean' },
    imperfectoSubjRa:  { yo: 'fuera',  voseo: 'fueras', tuteo: 'fueras', ustedeo: 'fuera', el: 'fuera', nosotros: 'fuéramos',ustedes: 'fueran',ellos: 'fueran' },
    imperfectoSubjSe:  { yo: 'fuese',  voseo: 'fueses', tuteo: 'fueses', ustedeo: 'fuese', el: 'fuese', nosotros: 'fuésemos',ustedes: 'fuesen',ellos: 'fuesen' },
    imperativoPos:     { voseo: 'sé',    tuteo: 'sé',    ustedeo: 'sea',    nosotros: 'seamos', ustedes: 'sean' },
    imperativoNeg:     { voseo: 'no seas', tuteo: 'no seas', ustedeo: 'no sea', nosotros: 'no seamos', ustedes: 'no sean' },
    voseoNotes: 'Presente ind. voseo "sos" es completamente irregular. Imperativo voseo "sé" (sin acento).',
  },

  // ── estar ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'estar', gerundio: 'estando', participio: 'estado',
    conjugationGroup: '-ar', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'estoy',    voseo: 'estás',    tuteo: 'estás',    ustedeo: 'está',    el: 'está',    nosotros: 'estamos',  ustedes: 'están',    ellos: 'están' },
    preteritoInd:      { yo: 'estuve',   voseo: 'estuviste',tuteo: 'estuviste',ustedeo: 'estuvo',  el: 'estuvo',  nosotros: 'estuvimos',ustedes: 'estuvieron',ellos: 'estuvieron' },
    imperfectoInd:     { yo: 'estaba',   voseo: 'estabas',  tuteo: 'estabas',  ustedeo: 'estaba',  el: 'estaba',  nosotros: 'estábamos',ustedes: 'estaban',  ellos: 'estaban' },
    futuroInd:         { yo: 'estaré',   voseo: 'estarás',  tuteo: 'estarás',  ustedeo: 'estará',  el: 'estará',  nosotros: 'estaremos',ustedes: 'estarán',  ellos: 'estarán' },
    condicionalInd:    { yo: 'estaría',  voseo: 'estarías', tuteo: 'estarías', ustedeo: 'estaría', el: 'estaría', nosotros: 'estaríamos',ustedes: 'estarían', ellos: 'estarían' },
    presenteSubj:      { yo: 'esté',     voseo: 'estés',    tuteo: 'estés',    ustedeo: 'esté',    el: 'esté',    nosotros: 'estemos',  ustedes: 'estén',    ellos: 'estén' },
    imperfectoSubjRa:  { yo: 'estuviera',voseo: 'estuvieras',tuteo: 'estuvieras',ustedeo: 'estuviera',el: 'estuviera',nosotros: 'estuviéramos',ustedes: 'estuvieran',ellos: 'estuvieran' },
    imperfectoSubjSe:  { yo: 'estuviese',voseo: 'estuvieses',tuteo: 'estuvieses',ustedeo: 'estuviese',el: 'estuviese',nosotros: 'estuviésemos',ustedes: 'estuviesen',ellos: 'estuviesen' },
    imperativoPos:     { voseo: 'está',    tuteo: 'está',    ustedeo: 'esté',    nosotros: 'estemos', ustedes: 'estén' },
    imperativoNeg:     { voseo: 'no estés', tuteo: 'no estés', ustedeo: 'no esté', nosotros: 'no estemos', ustedes: 'no estén' },
    voseoNotes: 'Voseo idéntico a tuteo en presente ind. ("estás"). Imperativo pos. voseo "está" (sin acento escrito especial).',
  },

  // ── haber ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'haber', gerundio: 'habiendo', participio: 'habido',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'he',      voseo: 'habés',    tuteo: 'has',      ustedeo: 'ha',      el: 'ha',      nosotros: 'hemos',    ustedes: 'han',      ellos: 'han' },
    preteritoInd:      { yo: 'hube',    voseo: 'hubiste',  tuteo: 'hubiste',  ustedeo: 'hubo',    el: 'hubo',    nosotros: 'hubimos',  ustedes: 'hubieron', ellos: 'hubieron' },
    imperfectoInd:     { yo: 'había',   voseo: 'habías',   tuteo: 'habías',   ustedeo: 'había',   el: 'había',   nosotros: 'habíamos', ustedes: 'habían',   ellos: 'habían' },
    futuroInd:         { yo: 'habré',   voseo: 'habrás',   tuteo: 'habrás',   ustedeo: 'habrá',   el: 'habrá',   nosotros: 'habremos', ustedes: 'habrán',   ellos: 'habrán' },
    condicionalInd:    { yo: 'habría',  voseo: 'habrías',  tuteo: 'habrías',  ustedeo: 'habría',  el: 'habría',  nosotros: 'habríamos',ustedes: 'habrían',  ellos: 'habrían' },
    presenteSubj:      { yo: 'haya',    voseo: 'hayas',    tuteo: 'hayas',    ustedeo: 'haya',    el: 'haya',    nosotros: 'hayamos',  ustedes: 'hayan',    ellos: 'hayan' },
    imperfectoSubjRa:  { yo: 'hubiera', voseo: 'hubieras', tuteo: 'hubieras', ustedeo: 'hubiera', el: 'hubiera', nosotros: 'hubiéramos',ustedes: 'hubieran',ellos: 'hubieran' },
    imperfectoSubjSe:  { yo: 'hubiese', voseo: 'hubieses', tuteo: 'hubieses', ustedeo: 'hubiese', el: 'hubiese', nosotros: 'hubiésemos',ustedes: 'hubiesen',ellos: 'hubiesen' },
    // haber has no real imperative (it is an auxiliary/impersonal verb)
    imperativoPos:     { voseo: 'hé',     tuteo: 'he',      ustedeo: 'haya',    nosotros: 'hayamos', ustedes: 'hayan' },
    imperativoNeg:     { voseo: 'no hayas', tuteo: 'no hayas', ustedeo: 'no haya', nosotros: 'no hayamos', ustedes: 'no hayan' },
    voseoNotes: 'Usado como auxiliar. Imperativo prácticamente inexistente en uso real.',
  },

  // ── tener ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'tener', gerundio: 'teniendo', participio: 'tenido',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: true, isStemChanging: false,
    presenteInd:       { yo: 'tengo',   voseo: 'tenés',    tuteo: 'tienes',   ustedeo: 'tiene',   el: 'tiene',   nosotros: 'tenemos',  ustedes: 'tienen',   ellos: 'tienen' },
    preteritoInd:      { yo: 'tuve',    voseo: 'tuviste',  tuteo: 'tuviste',  ustedeo: 'tuvo',    el: 'tuvo',    nosotros: 'tuvimos',  ustedes: 'tuvieron', ellos: 'tuvieron' },
    imperfectoInd:     { yo: 'tenía',   voseo: 'tenías',   tuteo: 'tenías',   ustedeo: 'tenía',   el: 'tenía',   nosotros: 'teníamos', ustedes: 'tenían',   ellos: 'tenían' },
    futuroInd:         { yo: 'tendré',  voseo: 'tendrás',  tuteo: 'tendrás',  ustedeo: 'tendrá',  el: 'tendrá',  nosotros: 'tendremos',ustedes: 'tendrán',  ellos: 'tendrán' },
    condicionalInd:    { yo: 'tendría', voseo: 'tendrías', tuteo: 'tendrías', ustedeo: 'tendría', el: 'tendría', nosotros: 'tendríamos',ustedes: 'tendrían', ellos: 'tendrían' },
    presenteSubj:      { yo: 'tenga',   voseo: 'tengas',   tuteo: 'tengas',   ustedeo: 'tenga',   el: 'tenga',   nosotros: 'tengamos', ustedes: 'tengan',   ellos: 'tengan' },
    imperfectoSubjRa:  { yo: 'tuviera', voseo: 'tuvieras', tuteo: 'tuvieras', ustedeo: 'tuviera', el: 'tuviera', nosotros: 'tuviéramos',ustedes: 'tuvieran',ellos: 'tuvieran' },
    imperfectoSubjSe:  { yo: 'tuviese', voseo: 'tuvieses', tuteo: 'tuvieses', ustedeo: 'tuviese', el: 'tuviese', nosotros: 'tuviésemos',ustedes: 'tuviesen',ellos: 'tuviesen' },
    imperativoPos:     { voseo: 'tené',   tuteo: 'ten',     ustedeo: 'tenga',   nosotros: 'tengamos', ustedes: 'tengan' },
    imperativoNeg:     { voseo: 'no tengas', tuteo: 'no tengas', ustedeo: 'no tenga', nosotros: 'no tengamos', ustedes: 'no tengan' },
  },

  // ── hacer ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'hacer', gerundio: 'haciendo', participio: 'hecho',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'hago',    voseo: 'hacés',    tuteo: 'haces',    ustedeo: 'hace',    el: 'hace',    nosotros: 'hacemos',  ustedes: 'hacen',    ellos: 'hacen' },
    preteritoInd:      { yo: 'hice',    voseo: 'hiciste',  tuteo: 'hiciste',  ustedeo: 'hizo',    el: 'hizo',    nosotros: 'hicimos',  ustedes: 'hicieron', ellos: 'hicieron' },
    imperfectoInd:     { yo: 'hacía',   voseo: 'hacías',   tuteo: 'hacías',   ustedeo: 'hacía',   el: 'hacía',   nosotros: 'hacíamos', ustedes: 'hacían',   ellos: 'hacían' },
    futuroInd:         { yo: 'haré',    voseo: 'harás',    tuteo: 'harás',    ustedeo: 'hará',    el: 'hará',    nosotros: 'haremos',  ustedes: 'harán',    ellos: 'harán' },
    condicionalInd:    { yo: 'haría',   voseo: 'harías',   tuteo: 'harías',   ustedeo: 'haría',   el: 'haría',   nosotros: 'haríamos', ustedes: 'harían',   ellos: 'harían' },
    presenteSubj:      { yo: 'haga',    voseo: 'hagas',    tuteo: 'hagas',    ustedeo: 'haga',    el: 'haga',    nosotros: 'hagamos',  ustedes: 'hagan',    ellos: 'hagan' },
    imperfectoSubjRa:  { yo: 'hiciera', voseo: 'hicieras', tuteo: 'hicieras', ustedeo: 'hiciera', el: 'hiciera', nosotros: 'hiciéramos',ustedes: 'hicieran',ellos: 'hicieran' },
    imperfectoSubjSe:  { yo: 'hiciese', voseo: 'hicieses', tuteo: 'hicieses', ustedeo: 'hiciese', el: 'hiciese', nosotros: 'hiciésemos',ustedes: 'hiciesen',ellos: 'hiciesen' },
    imperativoPos:     { voseo: 'hacé',  tuteo: 'haz',     ustedeo: 'haga',    nosotros: 'hagamos', ustedes: 'hagan' },
    imperativoNeg:     { voseo: 'no hagas', tuteo: 'no hagas', ustedeo: 'no haga', nosotros: 'no hagamos', ustedes: 'no hagan' },
  },

  // ── ir ───────────────────────────────────────────────────────────────────────
  {
    infinitive: 'ir', gerundio: 'yendo', participio: 'ido',
    conjugationGroup: '-ir', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'voy',   voseo: 'vas',    tuteo: 'vas',    ustedeo: 'va',    el: 'va',    nosotros: 'vamos',  ustedes: 'van',    ellos: 'van' },
    preteritoInd:      { yo: 'fui',   voseo: 'fuiste', tuteo: 'fuiste', ustedeo: 'fue',   el: 'fue',   nosotros: 'fuimos', ustedes: 'fueron', ellos: 'fueron' },
    imperfectoInd:     { yo: 'iba',   voseo: 'ibas',   tuteo: 'ibas',   ustedeo: 'iba',   el: 'iba',   nosotros: 'íbamos', ustedes: 'iban',   ellos: 'iban' },
    futuroInd:         { yo: 'iré',   voseo: 'irás',   tuteo: 'irás',   ustedeo: 'irá',   el: 'irá',   nosotros: 'iremos', ustedes: 'irán',   ellos: 'irán' },
    condicionalInd:    { yo: 'iría',  voseo: 'irías',  tuteo: 'irías',  ustedeo: 'iría',  el: 'iría',  nosotros: 'iríamos',ustedes: 'irían',  ellos: 'irían' },
    presenteSubj:      { yo: 'vaya',  voseo: 'vayas',  tuteo: 'vayas',  ustedeo: 'vaya',  el: 'vaya',  nosotros: 'vayamos',ustedes: 'vayan',  ellos: 'vayan' },
    imperfectoSubjRa:  { yo: 'fuera', voseo: 'fueras', tuteo: 'fueras', ustedeo: 'fuera', el: 'fuera', nosotros: 'fuéramos',ustedes: 'fueran',ellos: 'fueran' },
    imperfectoSubjSe:  { yo: 'fuese', voseo: 'fueses', tuteo: 'fueses', ustedeo: 'fuese', el: 'fuese', nosotros: 'fuésemos',ustedes: 'fuesen',ellos: 'fuesen' },
    imperativoPos:     { voseo: 'andá', tuteo: 've',    ustedeo: 'vaya',   nosotros: 'vayamos', ustedes: 'vayan' },
    imperativoNeg:     { voseo: 'no vayas', tuteo: 'no vayas', ustedeo: 'no vaya', nosotros: 'no vayamos', ustedes: 'no vayan' },
    voseoNotes: 'Presente ind. voseo "vas" sin acento (igual que tuteo). Imperativo pos. voseo "andá" (de "andar").',
  },

  // ── poder ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'poder', gerundio: 'pudiendo', participio: 'podido',
    conjugationGroup: '-er', isIrregular: false, isDiphthongating: true, isStemChanging: false,
    presenteInd:       { yo: 'puedo',   voseo: 'podés',    tuteo: 'puedes',   ustedeo: 'puede',   el: 'puede',   nosotros: 'podemos',  ustedes: 'pueden',   ellos: 'pueden' },
    preteritoInd:      { yo: 'pude',    voseo: 'pudiste',  tuteo: 'pudiste',  ustedeo: 'pudo',    el: 'pudo',    nosotros: 'pudimos',  ustedes: 'pudieron', ellos: 'pudieron' },
    imperfectoInd:     { yo: 'podía',   voseo: 'podías',   tuteo: 'podías',   ustedeo: 'podía',   el: 'podía',   nosotros: 'podíamos', ustedes: 'podían',   ellos: 'podían' },
    futuroInd:         { yo: 'podré',   voseo: 'podrás',   tuteo: 'podrás',   ustedeo: 'podrá',   el: 'podrá',   nosotros: 'podremos', ustedes: 'podrán',   ellos: 'podrán' },
    condicionalInd:    { yo: 'podría',  voseo: 'podrías',  tuteo: 'podrías',  ustedeo: 'podría',  el: 'podría',  nosotros: 'podríamos',ustedes: 'podrían',  ellos: 'podrían' },
    presenteSubj:      { yo: 'pueda',   voseo: 'puedas',   tuteo: 'puedas',   ustedeo: 'pueda',   el: 'pueda',   nosotros: 'podamos',  ustedes: 'puedan',   ellos: 'puedan' },
    imperfectoSubjRa:  { yo: 'pudiera', voseo: 'pudieras', tuteo: 'pudieras', ustedeo: 'pudiera', el: 'pudiera', nosotros: 'pudiéramos',ustedes: 'pudieran',ellos: 'pudieran' },
    imperfectoSubjSe:  { yo: 'pudiese', voseo: 'pudieses', tuteo: 'pudieses', ustedeo: 'pudiese', el: 'pudiese', nosotros: 'pudiésemos',ustedes: 'pudiesen',ellos: 'pudiesen' },
    imperativoPos:     { voseo: 'podé',  tuteo: 'puede',   ustedeo: 'pueda',   nosotros: 'podamos', ustedes: 'puedan' },
    imperativoNeg:     { voseo: 'no puedas', tuteo: 'no puedas', ustedeo: 'no pueda', nosotros: 'no podamos', ustedes: 'no puedan' },
  },

  // ── querer ───────────────────────────────────────────────────────────────────
  {
    infinitive: 'querer', gerundio: 'queriendo', participio: 'querido',
    conjugationGroup: '-er', isIrregular: false, isDiphthongating: true, isStemChanging: false,
    presenteInd:       { yo: 'quiero',   voseo: 'querés',    tuteo: 'quieres',   ustedeo: 'quiere',   el: 'quiere',   nosotros: 'queremos',  ustedes: 'quieren',   ellos: 'quieren' },
    preteritoInd:      { yo: 'quise',    voseo: 'quisiste',  tuteo: 'quisiste',  ustedeo: 'quiso',    el: 'quiso',    nosotros: 'quisimos',  ustedes: 'quisieron', ellos: 'quisieron' },
    imperfectoInd:     { yo: 'quería',   voseo: 'querías',   tuteo: 'querías',   ustedeo: 'quería',   el: 'quería',   nosotros: 'queríamos', ustedes: 'querían',   ellos: 'querían' },
    futuroInd:         { yo: 'querré',   voseo: 'querrás',   tuteo: 'querrás',   ustedeo: 'querrá',   el: 'querrá',   nosotros: 'querremos', ustedes: 'querrán',   ellos: 'querrán' },
    condicionalInd:    { yo: 'querría',  voseo: 'querrías',  tuteo: 'querrías',  ustedeo: 'querría',  el: 'querría',  nosotros: 'querríamos',ustedes: 'querrían',  ellos: 'querrían' },
    presenteSubj:      { yo: 'quiera',   voseo: 'quieras',   tuteo: 'quieras',   ustedeo: 'quiera',   el: 'quiera',   nosotros: 'queramos',  ustedes: 'quieran',   ellos: 'quieran' },
    imperfectoSubjRa:  { yo: 'quisiera', voseo: 'quisieras', tuteo: 'quisieras', ustedeo: 'quisiera', el: 'quisiera', nosotros: 'quisiéramos',ustedes: 'quisieran',ellos: 'quisieran' },
    imperfectoSubjSe:  { yo: 'quisiese', voseo: 'quisieses', tuteo: 'quisieses', ustedeo: 'quisiese', el: 'quisiese', nosotros: 'quisiésemos',ustedes: 'quisiesen',ellos: 'quisiesen' },
    imperativoPos:     { voseo: 'queré',  tuteo: 'quiere',   ustedeo: 'quiera',   nosotros: 'queramos', ustedes: 'quieran' },
    imperativoNeg:     { voseo: 'no quieras', tuteo: 'no quieras', ustedeo: 'no quiera', nosotros: 'no queramos', ustedes: 'no quieran' },
  },

  // ── saber ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'saber', gerundio: 'sabiendo', participio: 'sabido',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'sé',      voseo: 'sabés',    tuteo: 'sabes',    ustedeo: 'sabe',    el: 'sabe',    nosotros: 'sabemos',  ustedes: 'saben',    ellos: 'saben' },
    preteritoInd:      { yo: 'supe',    voseo: 'supiste',  tuteo: 'supiste',  ustedeo: 'supo',    el: 'supo',    nosotros: 'supimos',  ustedes: 'supieron', ellos: 'supieron' },
    imperfectoInd:     { yo: 'sabía',   voseo: 'sabías',   tuteo: 'sabías',   ustedeo: 'sabía',   el: 'sabía',   nosotros: 'sabíamos', ustedes: 'sabían',   ellos: 'sabían' },
    futuroInd:         { yo: 'sabré',   voseo: 'sabrás',   tuteo: 'sabrás',   ustedeo: 'sabrá',   el: 'sabrá',   nosotros: 'sabremos', ustedes: 'sabrán',   ellos: 'sabrán' },
    condicionalInd:    { yo: 'sabría',  voseo: 'sabrías',  tuteo: 'sabrías',  ustedeo: 'sabría',  el: 'sabría',  nosotros: 'sabríamos',ustedes: 'sabrían',  ellos: 'sabrían' },
    presenteSubj:      { yo: 'sepa',    voseo: 'sepas',    tuteo: 'sepas',    ustedeo: 'sepa',    el: 'sepa',    nosotros: 'sepamos',  ustedes: 'sepan',    ellos: 'sepan' },
    imperfectoSubjRa:  { yo: 'supiera', voseo: 'supieras', tuteo: 'supieras', ustedeo: 'supiera', el: 'supiera', nosotros: 'supiéramos',ustedes: 'supieran',ellos: 'supieran' },
    imperfectoSubjSe:  { yo: 'supiese', voseo: 'supieses', tuteo: 'supieses', ustedeo: 'supiese', el: 'supiese', nosotros: 'supiésemos',ustedes: 'supiesen',ellos: 'supiesen' },
    imperativoPos:     { voseo: 'sabé',  tuteo: 'sabe',    ustedeo: 'sepa',    nosotros: 'sepamos', ustedes: 'sepan' },
    imperativoNeg:     { voseo: 'no sepas', tuteo: 'no sepas', ustedeo: 'no sepa', nosotros: 'no sepamos', ustedes: 'no sepan' },
  },

  // ── venir ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'venir', gerundio: 'viniendo', participio: 'venido',
    conjugationGroup: '-ir', isIrregular: true, isDiphthongating: true, isStemChanging: false,
    presenteInd:       { yo: 'vengo',   voseo: 'venís',    tuteo: 'vienes',   ustedeo: 'viene',   el: 'viene',   nosotros: 'venimos',  ustedes: 'vienen',   ellos: 'vienen' },
    preteritoInd:      { yo: 'vine',    voseo: 'viniste',  tuteo: 'viniste',  ustedeo: 'vino',    el: 'vino',    nosotros: 'vinimos',  ustedes: 'vinieron', ellos: 'vinieron' },
    imperfectoInd:     { yo: 'venía',   voseo: 'venías',   tuteo: 'venías',   ustedeo: 'venía',   el: 'venía',   nosotros: 'veníamos', ustedes: 'venían',   ellos: 'venían' },
    futuroInd:         { yo: 'vendré',  voseo: 'vendrás',  tuteo: 'vendrás',  ustedeo: 'vendrá',  el: 'vendrá',  nosotros: 'vendremos',ustedes: 'vendrán',  ellos: 'vendrán' },
    condicionalInd:    { yo: 'vendría', voseo: 'vendrías', tuteo: 'vendrías', ustedeo: 'vendría', el: 'vendría', nosotros: 'vendríamos',ustedes: 'vendrían', ellos: 'vendrían' },
    presenteSubj:      { yo: 'venga',   voseo: 'vengas',   tuteo: 'vengas',   ustedeo: 'venga',   el: 'venga',   nosotros: 'vengamos', ustedes: 'vengan',   ellos: 'vengan' },
    imperfectoSubjRa:  { yo: 'viniera', voseo: 'vinieras', tuteo: 'vinieras', ustedeo: 'viniera', el: 'viniera', nosotros: 'viniéramos',ustedes: 'vinieran',ellos: 'vinieran' },
    imperfectoSubjSe:  { yo: 'viniese', voseo: 'vinieses', tuteo: 'vinieses', ustedeo: 'viniese', el: 'viniese', nosotros: 'viniésemos',ustedes: 'viniesen',ellos: 'viniesen' },
    imperativoPos:     { voseo: 'vení',  tuteo: 'ven',     ustedeo: 'venga',   nosotros: 'vengamos', ustedes: 'vengan' },
    imperativoNeg:     { voseo: 'no vengas', tuteo: 'no vengas', ustedeo: 'no venga', nosotros: 'no vengamos', ustedes: 'no vengan' },
  },

  // ── ver ──────────────────────────────────────────────────────────────────────
  {
    infinitive: 'ver', gerundio: 'viendo', participio: 'visto',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'veo',    voseo: 'ves',    tuteo: 'ves',    ustedeo: 've',    el: 've',    nosotros: 'vemos',  ustedes: 'ven',    ellos: 'ven' },
    preteritoInd:      { yo: 'vi',     voseo: 'viste',  tuteo: 'viste',  ustedeo: 'vio',   el: 'vio',   nosotros: 'vimos',  ustedes: 'vieron', ellos: 'vieron' },
    imperfectoInd:     { yo: 'veía',   voseo: 'veías',  tuteo: 'veías',  ustedeo: 'veía',  el: 'veía',  nosotros: 'veíamos',ustedes: 'veían',  ellos: 'veían' },
    futuroInd:         { yo: 'veré',   voseo: 'verás',  tuteo: 'verás',  ustedeo: 'verá',  el: 'verá',  nosotros: 'veremos',ustedes: 'verán',  ellos: 'verán' },
    condicionalInd:    { yo: 'vería',  voseo: 'verías', tuteo: 'verías', ustedeo: 'vería', el: 'vería', nosotros: 'veríamos',ustedes: 'verían', ellos: 'verían' },
    presenteSubj:      { yo: 'vea',    voseo: 'veas',   tuteo: 'veas',   ustedeo: 'vea',   el: 'vea',   nosotros: 'veamos', ustedes: 'vean',   ellos: 'vean' },
    imperfectoSubjRa:  { yo: 'viera',  voseo: 'vieras', tuteo: 'vieras', ustedeo: 'viera', el: 'viera', nosotros: 'viéramos',ustedes: 'vieran',ellos: 'vieran' },
    imperfectoSubjSe:  { yo: 'viese',  voseo: 'vieses', tuteo: 'vieses', ustedeo: 'viese', el: 'viese', nosotros: 'viésemos',ustedes: 'viesen',ellos: 'viesen' },
    imperativoPos:     { voseo: 've',   tuteo: 've',    ustedeo: 'vea',    nosotros: 'veamos', ustedes: 'vean' },
    imperativoNeg:     { voseo: 'no veas', tuteo: 'no veas', ustedeo: 'no vea', nosotros: 'no veamos', ustedes: 'no vean' },
    voseoNotes: 'Presente ind. voseo "ves" sin acento (igual que tuteo). No sigue el patrón -és regular.',
  },

  // ── dar ──────────────────────────────────────────────────────────────────────
  {
    infinitive: 'dar', gerundio: 'dando', participio: 'dado',
    conjugationGroup: '-ar', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'doy',    voseo: 'das',    tuteo: 'das',    ustedeo: 'da',    el: 'da',    nosotros: 'damos',  ustedes: 'dan',    ellos: 'dan' },
    preteritoInd:      { yo: 'di',     voseo: 'diste',  tuteo: 'diste',  ustedeo: 'dio',   el: 'dio',   nosotros: 'dimos',  ustedes: 'dieron', ellos: 'dieron' },
    imperfectoInd:     { yo: 'daba',   voseo: 'dabas',  tuteo: 'dabas',  ustedeo: 'daba',  el: 'daba',  nosotros: 'dábamos',ustedes: 'daban',  ellos: 'daban' },
    futuroInd:         { yo: 'daré',   voseo: 'darás',  tuteo: 'darás',  ustedeo: 'dará',  el: 'dará',  nosotros: 'daremos',ustedes: 'darán',  ellos: 'darán' },
    condicionalInd:    { yo: 'daría',  voseo: 'darías', tuteo: 'darías', ustedeo: 'daría', el: 'daría', nosotros: 'daríamos',ustedes: 'darían', ellos: 'darían' },
    presenteSubj:      { yo: 'dé',     voseo: 'des',    tuteo: 'des',    ustedeo: 'dé',    el: 'dé',    nosotros: 'demos',  ustedes: 'den',    ellos: 'den' },
    imperfectoSubjRa:  { yo: 'diera',  voseo: 'dieras', tuteo: 'dieras', ustedeo: 'diera', el: 'diera', nosotros: 'diéramos',ustedes: 'dieran',ellos: 'dieran' },
    imperfectoSubjSe:  { yo: 'diese',  voseo: 'dieses', tuteo: 'dieses', ustedeo: 'diese', el: 'diese', nosotros: 'diésemos',ustedes: 'diesen',ellos: 'diesen' },
    imperativoPos:     { voseo: 'dá',   tuteo: 'da',    ustedeo: 'dé',    nosotros: 'demos', ustedes: 'den' },
    imperativoNeg:     { voseo: 'no des', tuteo: 'no des', ustedeo: 'no dé', nosotros: 'no demos', ustedes: 'no den' },
    voseoNotes: 'Presente ind. voseo "das" sin acento (igual que tuteo). Imperativo pos. voseo "dá" (con acento diacrítico para distinguir de "da").',
  },

  // ── decir ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'decir', gerundio: 'diciendo', participio: 'dicho',
    conjugationGroup: '-ir', isIrregular: true, isDiphthongating: false, isStemChanging: true,
    presenteInd:       { yo: 'digo',   voseo: 'decís',    tuteo: 'dices',    ustedeo: 'dice',    el: 'dice',    nosotros: 'decimos',  ustedes: 'dicen',    ellos: 'dicen' },
    preteritoInd:      { yo: 'dije',   voseo: 'dijiste',  tuteo: 'dijiste',  ustedeo: 'dijo',    el: 'dijo',    nosotros: 'dijimos',  ustedes: 'dijeron',  ellos: 'dijeron' },
    imperfectoInd:     { yo: 'decía',  voseo: 'decías',   tuteo: 'decías',   ustedeo: 'decía',   el: 'decía',   nosotros: 'decíamos', ustedes: 'decían',   ellos: 'decían' },
    futuroInd:         { yo: 'diré',   voseo: 'dirás',    tuteo: 'dirás',    ustedeo: 'dirá',    el: 'dirá',    nosotros: 'diremos',  ustedes: 'dirán',    ellos: 'dirán' },
    condicionalInd:    { yo: 'diría',  voseo: 'dirías',   tuteo: 'dirías',   ustedeo: 'diría',   el: 'diría',   nosotros: 'diríamos', ustedes: 'dirían',   ellos: 'dirían' },
    presenteSubj:      { yo: 'diga',   voseo: 'digas',    tuteo: 'digas',    ustedeo: 'diga',    el: 'diga',    nosotros: 'digamos',  ustedes: 'digan',    ellos: 'digan' },
    imperfectoSubjRa:  { yo: 'dijera', voseo: 'dijeras',  tuteo: 'dijeras',  ustedeo: 'dijera',  el: 'dijera',  nosotros: 'dijéramos',ustedes: 'dijeran',  ellos: 'dijeran' },
    imperfectoSubjSe:  { yo: 'dijese', voseo: 'dijeses',  tuteo: 'dijeses',  ustedeo: 'dijese',  el: 'dijese',  nosotros: 'dijésemos',ustedes: 'dijesen',  ellos: 'dijesen' },
    imperativoPos:     { voseo: 'decí', tuteo: 'di',      ustedeo: 'diga',    nosotros: 'digamos', ustedes: 'digan' },
    imperativoNeg:     { voseo: 'no digas', tuteo: 'no digas', ustedeo: 'no diga', nosotros: 'no digamos', ustedes: 'no digan' },
  },

  // ── poner ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'poner', gerundio: 'poniendo', participio: 'puesto',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'pongo',   voseo: 'ponés',    tuteo: 'pones',    ustedeo: 'pone',    el: 'pone',    nosotros: 'ponemos',  ustedes: 'ponen',    ellos: 'ponen' },
    preteritoInd:      { yo: 'puse',    voseo: 'pusiste',  tuteo: 'pusiste',  ustedeo: 'puso',    el: 'puso',    nosotros: 'pusimos',  ustedes: 'pusieron', ellos: 'pusieron' },
    imperfectoInd:     { yo: 'ponía',   voseo: 'ponías',   tuteo: 'ponías',   ustedeo: 'ponía',   el: 'ponía',   nosotros: 'poníamos', ustedes: 'ponían',   ellos: 'ponían' },
    futuroInd:         { yo: 'pondré',  voseo: 'pondrás',  tuteo: 'pondrás',  ustedeo: 'pondrá',  el: 'pondrá',  nosotros: 'pondremos',ustedes: 'pondrán',  ellos: 'pondrán' },
    condicionalInd:    { yo: 'pondría', voseo: 'pondrías', tuteo: 'pondrías', ustedeo: 'pondría', el: 'pondría', nosotros: 'pondríamos',ustedes: 'pondrían', ellos: 'pondrían' },
    presenteSubj:      { yo: 'ponga',   voseo: 'pongas',   tuteo: 'pongas',   ustedeo: 'ponga',   el: 'ponga',   nosotros: 'pongamos', ustedes: 'pongan',   ellos: 'pongan' },
    imperfectoSubjRa:  { yo: 'pusiera', voseo: 'pusieras', tuteo: 'pusieras', ustedeo: 'pusiera', el: 'pusiera', nosotros: 'pusiéramos',ustedes: 'pusieran',ellos: 'pusieran' },
    imperfectoSubjSe:  { yo: 'pusiese', voseo: 'pusieses', tuteo: 'pusieses', ustedeo: 'pusiese', el: 'pusiese', nosotros: 'pusiésemos',ustedes: 'pusiesen',ellos: 'pusiesen' },
    imperativoPos:     { voseo: 'poné',  tuteo: 'pon',     ustedeo: 'ponga',   nosotros: 'pongamos', ustedes: 'pongan' },
    imperativoNeg:     { voseo: 'no pongas', tuteo: 'no pongas', ustedeo: 'no ponga', nosotros: 'no pongamos', ustedes: 'no pongan' },
  },

  // ── traer ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'traer', gerundio: 'trayendo', participio: 'traído',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'traigo',  voseo: 'traés',    tuteo: 'traes',    ustedeo: 'trae',    el: 'trae',    nosotros: 'traemos',  ustedes: 'traen',    ellos: 'traen' },
    preteritoInd:      { yo: 'traje',   voseo: 'trajiste', tuteo: 'trajiste', ustedeo: 'trajo',   el: 'trajo',   nosotros: 'trajimos', ustedes: 'trajeron', ellos: 'trajeron' },
    imperfectoInd:     { yo: 'traía',   voseo: 'traías',   tuteo: 'traías',   ustedeo: 'traía',   el: 'traía',   nosotros: 'traíamos', ustedes: 'traían',   ellos: 'traían' },
    futuroInd:         { yo: 'traeré',  voseo: 'traerás',  tuteo: 'traerás',  ustedeo: 'traerá',  el: 'traerá',  nosotros: 'traeremos',ustedes: 'traerán',  ellos: 'traerán' },
    condicionalInd:    { yo: 'traería', voseo: 'traerías', tuteo: 'traerías', ustedeo: 'traería', el: 'traería', nosotros: 'traeríamos',ustedes: 'traerían', ellos: 'traerían' },
    presenteSubj:      { yo: 'traiga',  voseo: 'traigas',  tuteo: 'traigas',  ustedeo: 'traiga',  el: 'traiga',  nosotros: 'traigamos',ustedes: 'traigan',  ellos: 'traigan' },
    imperfectoSubjRa:  { yo: 'trajera', voseo: 'trajeras', tuteo: 'trajeras', ustedeo: 'trajera', el: 'trajera', nosotros: 'trajéramos',ustedes: 'trajeran',ellos: 'trajeran' },
    imperfectoSubjSe:  { yo: 'trajese', voseo: 'trajeses', tuteo: 'trajeses', ustedeo: 'trajese', el: 'trajese', nosotros: 'trajésemos',ustedes: 'trajesen',ellos: 'trajesen' },
    imperativoPos:     { voseo: 'traé',  tuteo: 'trae',    ustedeo: 'traiga',  nosotros: 'traigamos', ustedes: 'traigan' },
    imperativoNeg:     { voseo: 'no traigas', tuteo: 'no traigas', ustedeo: 'no traiga', nosotros: 'no traigamos', ustedes: 'no traigan' },
  },

  // ── caer ─────────────────────────────────────────────────────────────────────
  {
    infinitive: 'caer', gerundio: 'cayendo', participio: 'caído',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'caigo',  voseo: 'caés',    tuteo: 'caes',    ustedeo: 'cae',    el: 'cae',    nosotros: 'caemos',  ustedes: 'caen',    ellos: 'caen' },
    preteritoInd:      { yo: 'caí',    voseo: 'caíste',  tuteo: 'caíste',  ustedeo: 'cayó',   el: 'cayó',   nosotros: 'caímos',  ustedes: 'cayeron', ellos: 'cayeron' },
    imperfectoInd:     { yo: 'caía',   voseo: 'caías',   tuteo: 'caías',   ustedeo: 'caía',   el: 'caía',   nosotros: 'caíamos', ustedes: 'caían',   ellos: 'caían' },
    futuroInd:         { yo: 'caeré',  voseo: 'caerás',  tuteo: 'caerás',  ustedeo: 'caerá',  el: 'caerá',  nosotros: 'caeremos',ustedes: 'caerán',  ellos: 'caerán' },
    condicionalInd:    { yo: 'caería', voseo: 'caerías', tuteo: 'caerías', ustedeo: 'caería', el: 'caería', nosotros: 'caeríamos',ustedes: 'caerían', ellos: 'caerían' },
    presenteSubj:      { yo: 'caiga',  voseo: 'caigas',  tuteo: 'caigas',  ustedeo: 'caiga',  el: 'caiga',  nosotros: 'caigamos',ustedes: 'caigan',  ellos: 'caigan' },
    imperfectoSubjRa:  { yo: 'cayera', voseo: 'cayeras', tuteo: 'cayeras', ustedeo: 'cayera', el: 'cayera', nosotros: 'cayéramos',ustedes: 'cayeran',ellos: 'cayeran' },
    imperfectoSubjSe:  { yo: 'cayese', voseo: 'cayeses', tuteo: 'cayeses', ustedeo: 'cayese', el: 'cayese', nosotros: 'cayésemos',ustedes: 'cayesen',ellos: 'cayesen' },
    imperativoPos:     { voseo: 'caé',  tuteo: 'cae',    ustedeo: 'caiga',  nosotros: 'caigamos', ustedes: 'caigan' },
    imperativoNeg:     { voseo: 'no caigas', tuteo: 'no caigas', ustedeo: 'no caiga', nosotros: 'no caigamos', ustedes: 'no caigan' },
  },

  // ── salir ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'salir', gerundio: 'saliendo', participio: 'salido',
    conjugationGroup: '-ir', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'salgo',   voseo: 'salís',    tuteo: 'sales',    ustedeo: 'sale',    el: 'sale',    nosotros: 'salimos',  ustedes: 'salen',    ellos: 'salen' },
    preteritoInd:      { yo: 'salí',    voseo: 'saliste',  tuteo: 'saliste',  ustedeo: 'salió',   el: 'salió',   nosotros: 'salimos',  ustedes: 'salieron', ellos: 'salieron' },
    imperfectoInd:     { yo: 'salía',   voseo: 'salías',   tuteo: 'salías',   ustedeo: 'salía',   el: 'salía',   nosotros: 'salíamos', ustedes: 'salían',   ellos: 'salían' },
    futuroInd:         { yo: 'saldré',  voseo: 'saldrás',  tuteo: 'saldrás',  ustedeo: 'saldrá',  el: 'saldrá',  nosotros: 'saldremos',ustedes: 'saldrán',  ellos: 'saldrán' },
    condicionalInd:    { yo: 'saldría', voseo: 'saldrías', tuteo: 'saldrías', ustedeo: 'saldría', el: 'saldría', nosotros: 'saldríamos',ustedes: 'saldrían', ellos: 'saldrían' },
    presenteSubj:      { yo: 'salga',   voseo: 'salgas',   tuteo: 'salgas',   ustedeo: 'salga',   el: 'salga',   nosotros: 'salgamos', ustedes: 'salgan',   ellos: 'salgan' },
    imperfectoSubjRa:  { yo: 'saliera', voseo: 'salieras', tuteo: 'salieras', ustedeo: 'saliera', el: 'saliera', nosotros: 'saliéramos',ustedes: 'salieran',ellos: 'salieran' },
    imperfectoSubjSe:  { yo: 'saliese', voseo: 'salieses', tuteo: 'salieses', ustedeo: 'saliese', el: 'saliese', nosotros: 'saliésemos',ustedes: 'saliesen',ellos: 'saliesen' },
    imperativoPos:     { voseo: 'salí',  tuteo: 'sal',     ustedeo: 'salga',   nosotros: 'salgamos', ustedes: 'salgan' },
    imperativoNeg:     { voseo: 'no salgas', tuteo: 'no salgas', ustedeo: 'no salga', nosotros: 'no salgamos', ustedes: 'no salgan' },
  },

  // ── valer ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'valer', gerundio: 'valiendo', participio: 'valido',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'valgo',   voseo: 'valés',    tuteo: 'vales',    ustedeo: 'vale',    el: 'vale',    nosotros: 'valemos',  ustedes: 'valen',    ellos: 'valen' },
    preteritoInd:      { yo: 'valí',    voseo: 'valiste',  tuteo: 'valiste',  ustedeo: 'valió',   el: 'valió',   nosotros: 'valimos',  ustedes: 'valieron', ellos: 'valieron' },
    imperfectoInd:     { yo: 'valía',   voseo: 'valías',   tuteo: 'valías',   ustedeo: 'valía',   el: 'valía',   nosotros: 'valíamos', ustedes: 'valían',   ellos: 'valían' },
    futuroInd:         { yo: 'valdré',  voseo: 'valdrás',  tuteo: 'valdrás',  ustedeo: 'valdrá',  el: 'valdrá',  nosotros: 'valdremos',ustedes: 'valdrán',  ellos: 'valdrán' },
    condicionalInd:    { yo: 'valdría', voseo: 'valdrías', tuteo: 'valdrías', ustedeo: 'valdría', el: 'valdría', nosotros: 'valdríamos',ustedes: 'valdrían', ellos: 'valdrían' },
    presenteSubj:      { yo: 'valga',   voseo: 'valgas',   tuteo: 'valgas',   ustedeo: 'valga',   el: 'valga',   nosotros: 'valgamos', ustedes: 'valgan',   ellos: 'valgan' },
    imperfectoSubjRa:  { yo: 'valiera', voseo: 'valieras', tuteo: 'valieras', ustedeo: 'valiera', el: 'valiera', nosotros: 'valiéramos',ustedes: 'valieran',ellos: 'valieran' },
    imperfectoSubjSe:  { yo: 'valiese', voseo: 'valieses', tuteo: 'valieses', ustedeo: 'valiese', el: 'valiese', nosotros: 'valiésemos',ustedes: 'valiesen',ellos: 'valiesen' },
    imperativoPos:     { voseo: 'valé',  tuteo: 'vale',    ustedeo: 'valga',   nosotros: 'valgamos', ustedes: 'valgan' },
    imperativoNeg:     { voseo: 'no valgas', tuteo: 'no valgas', ustedeo: 'no valga', nosotros: 'no valgamos', ustedes: 'no valgan' },
  },

  // ── oír ──────────────────────────────────────────────────────────────────────
  {
    infinitive: 'oír', gerundio: 'oyendo', participio: 'oído',
    conjugationGroup: '-ir', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'oigo',  voseo: 'oís',    tuteo: 'oyes',   ustedeo: 'oye',   el: 'oye',   nosotros: 'oímos',  ustedes: 'oyen',   ellos: 'oyen' },
    preteritoInd:      { yo: 'oí',    voseo: 'oíste',  tuteo: 'oíste',  ustedeo: 'oyó',   el: 'oyó',   nosotros: 'oímos',  ustedes: 'oyeron', ellos: 'oyeron' },
    imperfectoInd:     { yo: 'oía',   voseo: 'oías',   tuteo: 'oías',   ustedeo: 'oía',   el: 'oía',   nosotros: 'oíamos', ustedes: 'oían',   ellos: 'oían' },
    futuroInd:         { yo: 'oiré',  voseo: 'oirás',  tuteo: 'oirás',  ustedeo: 'oirá',  el: 'oirá',  nosotros: 'oiremos',ustedes: 'oirán',  ellos: 'oirán' },
    condicionalInd:    { yo: 'oiría', voseo: 'oirías', tuteo: 'oirías', ustedeo: 'oiría', el: 'oiría', nosotros: 'oiríamos',ustedes: 'oirían', ellos: 'oirían' },
    presenteSubj:      { yo: 'oiga',  voseo: 'oigas',  tuteo: 'oigas',  ustedeo: 'oiga',  el: 'oiga',  nosotros: 'oigamos',ustedes: 'oigan',  ellos: 'oigan' },
    imperfectoSubjRa:  { yo: 'oyera', voseo: 'oyeras', tuteo: 'oyeras', ustedeo: 'oyera', el: 'oyera', nosotros: 'oyéramos',ustedes: 'oyeran',ellos: 'oyeran' },
    imperfectoSubjSe:  { yo: 'oyese', voseo: 'oyeses', tuteo: 'oyeses', ustedeo: 'oyese', el: 'oyese', nosotros: 'oyésemos',ustedes: 'oyesen',ellos: 'oyesen' },
    imperativoPos:     { voseo: 'oí',   tuteo: 'oye',   ustedeo: 'oiga',   nosotros: 'oigamos', ustedes: 'oigan' },
    imperativoNeg:     { voseo: 'no oigas', tuteo: 'no oigas', ustedeo: 'no oiga', nosotros: 'no oigamos', ustedes: 'no oigan' },
  },

  // ── caber ────────────────────────────────────────────────────────────────────
  {
    infinitive: 'caber', gerundio: 'cabiendo', participio: 'cabido',
    conjugationGroup: '-er', isIrregular: true, isDiphthongating: false, isStemChanging: false,
    presenteInd:       { yo: 'quepo',   voseo: 'cabés',    tuteo: 'cabes',    ustedeo: 'cabe',    el: 'cabe',    nosotros: 'cabemos',  ustedes: 'caben',    ellos: 'caben' },
    preteritoInd:      { yo: 'cupe',    voseo: 'cupiste',  tuteo: 'cupiste',  ustedeo: 'cupo',    el: 'cupo',    nosotros: 'cupimos',  ustedes: 'cupieron', ellos: 'cupieron' },
    imperfectoInd:     { yo: 'cabía',   voseo: 'cabías',   tuteo: 'cabías',   ustedeo: 'cabía',   el: 'cabía',   nosotros: 'cabíamos', ustedes: 'cabían',   ellos: 'cabían' },
    futuroInd:         { yo: 'cabré',   voseo: 'cabrás',   tuteo: 'cabrás',   ustedeo: 'cabrá',   el: 'cabrá',   nosotros: 'cabremos', ustedes: 'cabrán',   ellos: 'cabrán' },
    condicionalInd:    { yo: 'cabría',  voseo: 'cabrías',  tuteo: 'cabrías',  ustedeo: 'cabría',  el: 'cabría',  nosotros: 'cabríamos',ustedes: 'cabrían',  ellos: 'cabrían' },
    presenteSubj:      { yo: 'quepa',   voseo: 'quepas',   tuteo: 'quepas',   ustedeo: 'quepa',   el: 'quepa',   nosotros: 'quepamos', ustedes: 'quepan',   ellos: 'quepan' },
    imperfectoSubjRa:  { yo: 'cupiera', voseo: 'cupieras', tuteo: 'cupieras', ustedeo: 'cupiera', el: 'cupiera', nosotros: 'cupiéramos',ustedes: 'cupieran',ellos: 'cupieran' },
    imperfectoSubjSe:  { yo: 'cupiese', voseo: 'cupieses', tuteo: 'cupieses', ustedeo: 'cupiese', el: 'cupiese', nosotros: 'cupiésemos',ustedes: 'cupiesen',ellos: 'cupiesen' },
    imperativoPos:     { voseo: 'cabé',  tuteo: 'cabe',    ustedeo: 'quepa',   nosotros: 'quepamos', ustedes: 'quepan' },
    imperativoNeg:     { voseo: 'no quepas', tuteo: 'no quepas', ustedeo: 'no quepa', nosotros: 'no quepamos', ustedes: 'no quepan' },
  },

];
