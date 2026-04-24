'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ProviderCredential } from '@edi/shared';
import { transformTextAction, type ApiTransformation } from '@/lib/actions/transform';
import { activateCredentialAction } from '@/lib/actions/credentials';
import { Button } from '@/components/ui/Button';

// ── Local transform utilities ─────────────────────────────────────────────────
// Ported from apps/extension/src/tone-engine/formatters/CleanFormatter.ts

function _mapChars(text: string, fn: (cp: number) => number | null): string {
  return [...text]
    .map((ch) => {
      const cp = ch.codePointAt(0);
      if (cp === undefined) return ch;
      const out = fn(cp);
      return out !== null ? String.fromCodePoint(out) : ch;
    })
    .join('');
}

const _isUC = (c: number) => c >= 65 && c <= 90;
const _isLC = (c: number) => c >= 97 && c <= 122;
const _isDig = (c: number) => c >= 48 && c <= 57;

function toUnicodeBold(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d400 + (c - 65);
    if (_isLC(c)) return 0x1d41a + (c - 97);
    if (_isDig(c)) return 0x1d7ce + (c - 48);
    return null;
  });
}

function toUnicodeItalic(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d434 + (c - 65);
    if (_isLC(c)) {
      if (c === 104) return 0x210e;
      return 0x1d44e + (c - 97);
    }
    return null;
  });
}

function toUnicodeBoldItalic(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d468 + (c - 65);
    if (_isLC(c)) return 0x1d482 + (c - 97);
    return null;
  });
}

function toUnicodeBoldScript(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d4d0 + (c - 65);
    if (_isLC(c)) return 0x1d4ea + (c - 97);
    return null;
  });
}

function toUnicodeMonospace(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d670 + (c - 65);
    if (_isLC(c)) return 0x1d68a + (c - 97);
    if (_isDig(c)) return 0x1d7f6 + (c - 48);
    return null;
  });
}

function toUnicodeFullwidth(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0xff21 + (c - 65);
    if (_isLC(c)) return 0xff41 + (c - 97);
    if (_isDig(c)) return 0xff10 + (c - 48);
    return null;
  });
}

function stripUnicodeStyles(text: string): string {
  const upperBases = [
    0x1d400, 0x1d434, 0x1d468, 0x1d4d0, 0x1d5a0,
    0x1d5d4, 0x1d608, 0x1d63c, 0x1d670,
  ];
  const lowerBases = [
    0x1d41a, 0x1d44e, 0x1d482, 0x1d4ea, 0x1d5ba,
    0x1d5ee, 0x1d622, 0x1d656, 0x1d68a,
  ];
  const digitBases = [0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6];
  const result = text.normalize('NFKC');
  return _mapChars(result, (cp) => {
    if (cp === 0x210e) return 104;
    for (const base of upperBases) {
      if (cp >= base && cp < base + 26) return 65 + (cp - base);
    }
    for (const base of lowerBases) {
      if (cp >= base && cp < base + 26) return 97 + (cp - base);
    }
    for (const base of digitBases) {
      if (cp >= base && cp < base + 10) return 48 + (cp - base);
    }
    return null;
  });
}

function removeFormatting(text: string): string {
  let result = stripUnicodeStyles(text);
  result = result.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  result = result.replace(/\u00AD/g, '');
  result = result.replace(/\s*[—–]\s*/g, ' - ');
  result = result.replace(/[ \t]+/g, ' ');
  result = result.replace(/(\r?\n){3,}/g, '\n\n');
  result = result.replace(/\r\n/g, '\n');
  result = result
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
  return result.trim();
}

function toSentenceCase(text: string): string {
  return text.replace(
    /(^|[.!?]\s+|\n\n+)([ \t]*[¿¡]?[ \t]*)([a-záéíóúüñ])/gi,
    (_match, boundary: string, prefix: string, firstLetter: string) =>
      boundary + prefix + firstLetter.toUpperCase(),
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type LocalTransformation =
  | 'uppercase'
  | 'lowercase'
  | 'sentence-case'
  | 'remove-formatting'
  | 'format-unicode-bold'
  | 'format-unicode-italic'
  | 'format-unicode-bold-italic'
  | 'format-unicode-bold-script'
  | 'format-unicode-monospace'
  | 'format-unicode-fullwidth';

type ToneTransformation = 'tone-voseo-cr' | 'tone-tuteo' | 'tone-ustedeo';
type ToneTarget = 'voseo' | 'tuteo' | 'ustedeo';

// ── Local tone transformer ────────────────────────────────────────────────────
// Self-contained port of the ToneEngine for use in the web editor.

type ToneForms = [voseo: string, tuteo: string, ustedeo: string];

// Each row: [voseo, tuteo, ustedeo] — present indicative + key imperatives
const TONE_VERB_TABLE: ToneForms[] = [
  ['sos',       'eres',       'es'],
  ['estás',     'estás',      'está'],
  ['vas',       'vas',        'va'],
  ['das',       'das',        'da'],
  ['habés',     'has',        'ha'],
  ['tenés',     'tienes',     'tiene'],
  ['querés',    'quieres',    'quiere'],
  ['podés',     'puedes',     'puede'],
  ['sabés',     'sabes',      'sabe'],
  ['hacés',     'haces',      'hace'],
  ['venís',     'vienes',     'viene'],
  ['sentís',    'sientes',    'siente'],
  ['vivís',     'vives',      'vive'],
  ['pedís',     'pides',      'pide'],
  ['decís',     'dices',      'dice'],
  ['salís',     'sales',      'sale'],
  ['conocés',   'conoces',    'conoce'],
  ['parecés',   'pareces',    'parece'],
  ['entendés',  'entiendes',  'entiende'],
  ['volvés',    'vuelves',    'vuelve'],
  ['encontrás', 'encuentras', 'encuentra'],
  ['contás',    'cuentas',    'cuenta'],
  ['recordás',  'recuerdas',  'recuerda'],
  ['probás',    'pruebas',    'prueba'],
  ['pensás',    'piensas',    'piensa'],
  ['cerrás',    'cierras',    'cierra'],
  ['empezás',   'empiezas',   'empieza'],
  ['comenzás',  'comienzas',  'comienza'],
  ['preferís',  'prefieres',  'prefiere'],
  ['dormís',    'duermes',    'duerme'],
  ['morís',     'mueres',     'muere'],
  ['seguís',    'sigues',     'sigue'],
  ['elegís',    'eliges',     'elige'],
  ['repetís',   'repites',    'repite'],
  ['movés',     'mueves',     'mueve'],
  ['resolvés',  'resuelves',  'resuelve'],
  ['hablás',    'hablas',     'habla'],
  ['trabajás',  'trabajas',   'trabaja'],
  ['llegás',    'llegas',     'llega'],
  ['comprás',   'compras',    'compra'],
  ['tomás',     'tomas',      'toma'],
  ['usás',      'usas',       'usa'],
  ['esperás',   'esperas',    'espera'],
  ['necesitás', 'necesitas',  'necesita'],
  ['preguntás', 'preguntas',  'pregunta'],
  ['ayudás',    'ayudas',     'ayuda'],
  ['escuchás',  'escuchas',   'escucha'],
  ['mirás',     'miras',      'mira'],
  ['pasás',     'pasas',      'pasa'],
  ['entrás',    'entras',     'entra'],
  ['ganás',     'ganas',      'gana'],
  ['dejás',     'dejas',      'deja'],
  ['buscás',    'buscas',     'busca'],
  ['guardás',   'guardas',    'guarda'],
  ['bajás',     'bajas',      'baja'],
  ['subís',     'subes',      'sube'],
  ['comés',     'comes',      'come'],
  ['bebés',     'bebes',      'bebe'],
  ['leés',      'lees',       'lee'],
  ['corrés',    'corres',     'corre'],
  ['vendés',    'vendes',     'vende'],
  ['rompés',    'rompes',     'rompe'],
  ['creés',     'crees',      'cree'],
  ['traés',     'traes',      'trae'],
  ['ponés',     'pones',      'pone'],
  ['escribís',  'escribes',   'escribe'],
  ['abrís',     'abres',      'abre'],
  ['recibís',   'recibes',    'recibe'],
  ['servís',    'sirves',     'sirve'],
  // Imperatives (common in advertising)
  ['vení',      'ven',        'venga'],
  ['hacé',      'haz',        'haga'],
  ['poné',      'pon',        'ponga'],
  ['salí',      'sal',        'salga'],
  ['decí',      'di',         'diga'],
  ['andá',      've',         'vaya'],
  ['tené',      'ten',        'tenga'],
];

function _deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const _TONE_LOOKUP: Map<string, ToneForms> = (() => {
  const m = new Map<string, ToneForms>();
  for (const entry of TONE_VERB_TABLE) {
    for (const form of entry) {
      const key1 = form.toLowerCase();
      const key2 = _deaccent(key1);
      if (!m.has(key1)) m.set(key1, entry);
      if (!m.has(key2)) m.set(key2, entry);
    }
  }
  return m;
})();

// ── Imperative lookup ─────────────────────────────────────────────────────────
// Each entry: [indicative triple, imperative triple]
const TONE_IMP_PAIRS: Array<[ToneForms, ToneForms]> = [
  // AR regular
  [['hablás',    'hablas',    'habla'],    ['hablá',    'habla',    'hable']],
  [['comprás',   'compras',   'compra'],   ['comprá',   'compra',   'compre']],
  [['trabajás',  'trabajas',  'trabaja'],  ['trabajá',  'trabaja',  'trabaje']],
  [['tomás',     'tomas',     'toma'],     ['tomá',     'toma',     'tome']],
  [['usás',      'usas',      'usa'],      ['usá',      'usa',      'use']],
  [['esperás',   'esperas',   'espera'],   ['esperá',   'espera',   'espere']],
  [['mirás',     'miras',     'mira'],     ['mirá',     'mira',     'mire']],
  [['buscás',    'buscas',    'busca'],    ['buscá',    'busca',    'busque']],
  [['llegás',    'llegas',    'llega'],    ['llegá',    'llega',    'llegue']],
  [['entrás',    'entras',    'entra'],    ['entrá',    'entra',    'entre']],
  [['pasás',     'pasas',     'pasa'],     ['pasá',     'pasa',     'pase']],
  [['dejás',     'dejas',     'deja'],     ['dejá',     'deja',     'deje']],
  [['ayudás',    'ayudas',    'ayuda'],    ['ayudá',    'ayuda',    'ayude']],
  [['escuchás',  'escuchas',  'escucha'],  ['escuchá',  'escucha',  'escuche']],
  [['ganás',     'ganas',     'gana'],     ['ganá',     'gana',     'gane']],
  [['bajás',     'bajas',     'baja'],     ['bajá',     'baja',     'baje']],
  [['guardás',   'guardas',   'guarda'],   ['guardá',   'guarda',   'guarde']],
  [['preguntás', 'preguntas', 'pregunta'], ['preguntá', 'pregunta', 'pregunte']],
  [['necesitás', 'necesitas', 'necesita'], ['necesitá', 'necesita', 'necesite']],
  [['aprovechás','aprovechas','aprovecha'],['aprovechá','aprovecha','aproveche']],
  [['explorás',  'exploras',  'explora'],  ['explorá',  'explora',  'explore']],
  [['disfrutás', 'disfrutas', 'disfruta'], ['disfrutá', 'disfruta', 'disfrute']],
  [['conectás',  'conectas',  'conecta'],  ['conectá',  'conecta',  'conecte']],
  [['registrás', 'registras', 'registra'], ['registrá', 'registra', 'registre']],
  [['descargás', 'descargas', 'descarga'], ['descargá', 'descarga', 'descargue']],
  [['instalás',  'instalas',  'instala'],  ['instalá',  'instala',  'instale']],
  [['activás',   'activas',   'activa'],   ['activá',   'activa',   'active']],
  [['confirmás', 'confirmas', 'confirma'], ['confirmá', 'confirma', 'confirme']],
  [['contactás', 'contactas', 'contacta'], ['contactá', 'contacta', 'contacte']],
  [['visitás',   'visitas',   'visita'],   ['visitá',   'visita',   'visite']],
  // ER regular
  [['comés',     'comes',     'come'],     ['comé',     'come',     'coma']],
  [['leés',      'lees',      'lee'],      ['leé',      'lee',      'lea']],
  [['corrés',    'corres',    'corre'],    ['corré',    'corre',    'corra']],
  [['vendés',    'vendes',    'vende'],    ['vendé',    'vende',    'venda']],
  [['rompés',    'rompes',    'rompe'],    ['rompé',    'rompe',    'rompa']],
  [['creés',     'crees',     'cree'],     ['creé',     'cree',     'crea']],
  // IR regular
  [['vivís',     'vives',     'vive'],     ['viví',     'vive',     'viva']],
  [['escribís',  'escribes',  'escribe'],  ['escribí',  'escribe',  'escriba']],
  [['abrís',     'abres',     'abre'],     ['abrí',     'abre',     'abra']],
  [['recibís',   'recibes',   'recibe'],   ['recibí',   'recibe',   'reciba']],
  [['subís',     'subes',     'sube'],     ['subí',     'sube',     'suba']],
  [['descubrís', 'descubres', 'descubre'], ['descubrí', 'descubre', 'descubra']],
  [['compartís', 'compartes', 'comparte'], ['compartí', 'comparte', 'comparta']],
  [['aprendés',  'aprendes',  'aprende'],  ['aprendé',  'aprende',  'aprenda']],
  // Irregular
  [['tenés',     'tienes',    'tiene'],    ['tené',     'ten',      'tenga']],
  [['venís',     'vienes',    'viene'],    ['vení',     'ven',      'venga']],
  [['hacés',     'haces',     'hace'],     ['hacé',     'haz',      'haga']],
  [['ponés',     'pones',     'pone'],     ['poné',     'pon',      'ponga']],
  [['salís',     'sales',     'sale'],     ['salí',     'sal',      'salga']],
  [['decís',     'dices',     'dice'],     ['decí',     'di',       'diga']],
  [['vas',       'vas',       'va'],       ['andá',     've',       'vaya']],
  [['traés',     'traes',     'trae'],     ['traé',     'trae',     'traiga']],
  // Stem-changing
  [['querés',    'quieres',   'quiere'],   ['queré',    'quiere',   'quiera']],
  [['entendés',  'entiendes', 'entiende'], ['entendé',  'entiende', 'entienda']],
  [['probás',    'pruebas',   'prueba'],   ['probá',    'prueba',   'pruebe']],
  [['empezás',   'empiezas',  'empieza'],  ['empezá',   'empieza',  'empiece']],
  [['volvés',    'vuelves',   'vuelve'],   ['volvé',    'vuelve',   'vuelva']],
  [['elegís',    'eliges',    'elige'],    ['elegí',    'elige',    'elija']],
  [['seguís',    'sigues',    'sigue'],    ['seguí',    'sigue',    'siga']],
  [['pedís',     'pides',     'pide'],     ['pedí',     'pide',     'pida']],
  [['servís',    'sirves',    'sirve'],    ['serví',    'sirve',    'sirva']],
  [['accedés',   'accedes',   'accede'],   ['accedé',   'accede',   'acceda']],
];

const _TONE_IMP_LOOKUP: Map<string, ToneForms> = (() => {
  const m = new Map<string, ToneForms>();
  for (const [ind, imp] of TONE_IMP_PAIRS) {
    for (const form of ind) {
      const key1 = form.toLowerCase();
      const key2 = _deaccent(key1);
      if (!m.has(key1)) m.set(key1, imp);
      if (!m.has(key2)) m.set(key2, imp);
    }
  }
  return m;
})();

function _preserveToneCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function applyLocalTone(text: string, target: ToneTarget, verbalMode: 'indicativo' | 'imperativo' = 'indicativo'): string {
  const idx = target === 'voseo' ? 0 : target === 'tuteo' ? 1 : 2;

  // 1. Word-level verb replacements
  const verbReplaced = text.replace(/[\wáéíóúüñÁÉÍÓÚÜÑ]+/g, (word) => {
    if (verbalMode === 'imperativo') {
      const impEntry =
        _TONE_IMP_LOOKUP.get(word.toLowerCase()) ??
        _TONE_IMP_LOOKUP.get(_deaccent(word.toLowerCase()));
      if (impEntry) {
        const replacement = impEntry[idx] ?? word;
        if (replacement.toLowerCase() !== word.toLowerCase()) {
          return _preserveToneCase(word, replacement);
        }
      }
    }
    const entry =
      _TONE_LOOKUP.get(word.toLowerCase()) ??
      _TONE_LOOKUP.get(_deaccent(word.toLowerCase()));
    if (!entry) return word;
    const replacement = entry[idx] ?? word;
    if (replacement.toLowerCase() === word.toLowerCase()) return word;
    return _preserveToneCase(word, replacement);
  });

  // 2. Pronoun replacements
  const PRONOUNS: Array<[RegExp, string, string, string]> = [
    [/\bvos\b/gi,     'vos',     'tú',      'usted'],
    [/\btú\b/gi,      'vos',     'tú',      'usted'],
    [/\busted\b/gi,   'vos',     'tú',      'usted'],
    [/\bti\b/gi,      'vos',     'ti',      'usted'],
    [/\bcontigo\b/gi, 'con vos', 'contigo', 'con usted'],
  ];

  return PRONOUNS.reduce((t, [pattern, v, tu, u]) => {
    const rep = idx === 0 ? v : idx === 1 ? tu : u;
    return t.replace(pattern, (match) => _preserveToneCase(match, rep));
  }, verbReplaced);
}

type Status = { type: 'success' | 'error' | 'warning'; message: string } | null;

function applyLocalTransform(text: string, t: LocalTransformation): string {
  switch (t) {
    case 'uppercase':
      return stripUnicodeStyles(text).toUpperCase();
    case 'lowercase':
      return stripUnicodeStyles(text).toLowerCase();
    case 'sentence-case':
      return toSentenceCase(stripUnicodeStyles(text));
    case 'remove-formatting':
      return removeFormatting(text);
    case 'format-unicode-bold':
      return toUnicodeBold(stripUnicodeStyles(text));
    case 'format-unicode-italic':
      return toUnicodeItalic(stripUnicodeStyles(text));
    case 'format-unicode-bold-italic':
      return toUnicodeBoldItalic(stripUnicodeStyles(text));
    case 'format-unicode-bold-script':
      return toUnicodeBoldScript(stripUnicodeStyles(text));
    case 'format-unicode-monospace':
      return toUnicodeMonospace(stripUnicodeStyles(text));
    case 'format-unicode-fullwidth':
      return toUnicodeFullwidth(stripUnicodeStyles(text));
  }
}

const FRIENDLY_ERRORS: Record<string, string> = {
  NOT_AUTHENTICATED: 'Debés iniciar sesión en EDI para usar esta función.',
  UNAUTHORIZED: 'Debés iniciar sesión en EDI para usar esta función.',
  QUOTA_EXCEEDED: 'Alcanzaste tu límite diario de correcciones con IA.',
  QUOTA_LIMIT_EXCEEDED: 'Alcanzaste tu límite diario de correcciones con IA.',
  NETWORK_ERROR: 'Sin conexión. Verificá tu conexión a internet.',
  NO_ACTIVE_CREDENTIAL:
    'No tenés una clave de IA configurada. Agregá tu API key en Claves de IA.',
  PROVIDER_ERROR: 'El proveedor de IA devolvió un error. Verificá tu API key en Claves de IA.',
};

// ── Shared button class ───────────────────────────────────────────────────────

const transformBtnClass =
  'rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 ' +
  'transition-colors hover:border-gray-300 hover:bg-gray-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ' +
  'whitespace-nowrap';

// ── AI provider/model constants ───────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  'google-ai': 'Google AI',
};

const AI_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  'google-ai': 'gemini-1.5-flash',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface TextEditorClientProps {
  activeCredential?: ProviderCredential | null;
  allCredentials?: ProviderCredential[];
}

export function TextEditorClient({ activeCredential, allCredentials = [] }: TextEditorClientProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [isPending, startTransition] = useTransition();
  const [isActivating, startActivating] = useTransition();
  const [localActiveId, setLocalActiveId] = useState(activeCredential?.id ?? null);
  const [toneMode, setToneMode] = useState<'local' | 'ai'>('local');
  const [verbalMode, setVerbalMode] = useState<'indicativo' | 'imperativo'>('indicativo');

  const localActive = allCredentials.find((c) => c.id === localActiveId) ?? activeCredential;

  function handleActivate(id: string) {
    if (id === localActiveId || isActivating) return;
    setLocalActiveId(id);
    startActivating(async () => {
      await activateCredentialAction(id);
      router.refresh();
    });
  }

  function handleLocal(t: LocalTransformation) {
    setText((prev) => applyLocalTransform(prev, t));
    setStatus(null);
  }

  function handleTone(t: ToneTransformation) {
    if (toneMode === 'local') {
      const targetMap: Record<ToneTransformation, ToneTarget> = {
        'tone-voseo-cr': 'voseo',
        'tone-tuteo': 'tuteo',
        'tone-ustedeo': 'ustedeo',
      };
      setText((prev) => applyLocalTone(prev, targetMap[t], verbalMode));
      setStatus(null);
    } else {
      handleApi(t);
    }
  }

  function handleApi(transformation: ApiTransformation) {
    if (!text.trim()) {
      setStatus({ type: 'warning', message: 'Escribí o pegá texto primero.' });
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const res = await transformTextAction(text, transformation, verbalMode);
      if (res.error) {
        setStatus({
          type: 'error',
          message: FRIENDLY_ERRORS[res.error] ?? `Error: ${res.error}. Intentá de nuevo.`,
        });
        return;
      }
      if (typeof res.result === 'string') {
        setText(res.result);
        if (res.source === 'ai-fallback' && res.warnings?.[0]) {
          setStatus({ type: 'warning', message: res.warnings[0].message });
        }
      }
    });
  }

  function handleCopy() {
    if (!text) return;
    void navigator.clipboard.writeText(text).then(
      () => setStatus({ type: 'success', message: '¡Texto copiado al portapapeles!' }),
      () => setStatus({ type: 'error', message: 'No se pudo copiar. Intentá manualmente (Ctrl+C).' }),
    );
  }

  const statusColorClass =
    status?.type === 'error'
      ? 'text-red-600'
      : status?.type === 'warning'
        ? 'text-amber-600'
        : 'text-green-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* AI credential switcher */}
      {allCredentials.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400">IA:</span>
          {allCredentials.map((cred) => {
            const isActive = cred.id === localActiveId;
            return (
              <button
                key={cred.id}
                type="button"
                disabled={isActivating || cred.isExpired}
                onClick={() => handleActivate(cred.id)}
                title={cred.isExpired ? 'Clave expirada' : `Usar ${PROVIDER_LABELS[cred.provider] ?? cred.provider} — ${cred.label}`}
                className={
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ' +
                  (isActive
                    ? 'border-indigo-400 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400'
                    : cred.isExpired
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer')
                }
              >
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                )}
                <span>{PROVIDER_LABELS[cred.provider] ?? cred.provider}</span>
                <span className="text-gray-400">·</span>
                <span>{cred.label}</span>
              </button>
            );
          })}
          {isActivating && (
            <span className="w-full text-xs text-gray-400">Cambiando…</span>
          )}
          {localActive && (
            <span className="text-xs text-gray-400">
              Modelo: {localActive.selectedModel ?? AI_MODELS[localActive.provider] ?? '—'}
            </span>
          )}
        </div>
      ) : (
        <div className="mb-5">
          <span className="text-xs text-gray-400">
            Sin clave de IA configurada.{' '}
            <Link href="/credentials/new" className="text-indigo-600 hover:underline">
              Agregar clave
            </Link>
          </span>
        </div>
      )}

      {/* Textarea */}
      <div className="mb-5">
        <label htmlFor="edi-web-textarea" className="mb-1.5 block text-sm font-medium text-gray-700">
          Texto a editar
        </label>
        <textarea
          id="edi-web-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          spellCheck
          lang="es"
          placeholder="Escribí o pegá tu texto aquí…"
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Status region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`mb-4 min-h-[1.25rem] text-sm ${status ? statusColorClass : ''}`}
      >
        {status?.message}
      </div>

      {/* Action groups */}
      <div className="space-y-4">
        {/* Formato */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Formato
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('uppercase')}>
              MAYÚSCULAS
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('lowercase')}>
              minúsculas
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('sentence-case')}>
              Tipo oración
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('remove-formatting')}>
              Quitar formato
            </button>
          </div>
        </div>

        {/* Estilo Unicode */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Estilo Unicode
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('format-unicode-bold')}>
              𝐍𝐞𝐠𝐫𝐢𝐭𝐚
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('format-unicode-italic')}>
              𝐶𝑢𝑟𝑠𝑖𝑣𝑎
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('format-unicode-bold-italic')}>
              𝑵𝒆𝒈.𝑪𝒖𝒓.
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('format-unicode-bold-script')}>
              𝓢𝓬𝓻𝓲𝓹𝓽
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('format-unicode-monospace')}>
              𝙼𝚘𝚗𝚘
            </button>
            <button type="button" className={transformBtnClass} onClick={() => handleLocal('format-unicode-fullwidth')}>
              Ａｎｃｈｏ
            </button>
          </div>
        </div>

        {/* Tono */}
        <div>
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tono
            </p>
            <div
              role="group"
              aria-label="Motor de transformación de tono"
              className="flex overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs"
            >
              <button
                type="button"
                aria-pressed={toneMode === 'local'}
                onClick={() => setToneMode('local')}
                className={
                  'px-2.5 py-0.5 font-medium transition-colors ' +
                  (toneMode === 'local'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700')
                }
              >
                Local
              </button>
              <button
                type="button"
                aria-pressed={toneMode === 'ai'}
                onClick={() => setToneMode('ai')}
                className={
                  'px-2.5 py-0.5 font-medium transition-colors ' +
                  (toneMode === 'ai'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700')
                }
              >
                IA ✦
              </button>
            </div>
          </div>
          {/* Verbal mode toggle */}
          <div
            role="group"
            aria-label="Modo verbal"
            className="mb-2 flex w-fit overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs"
          >
            <button
              type="button"
              aria-pressed={verbalMode === 'indicativo'}
              onClick={() => setVerbalMode('indicativo')}
              className={
                'px-2.5 py-0.5 font-medium transition-colors ' +
                (verbalMode === 'indicativo'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700')
              }
            >
              Indicativo
            </button>
            <button
              type="button"
              aria-pressed={verbalMode === 'imperativo'}
              onClick={() => setVerbalMode('imperativo')}
              className={
                'px-2.5 py-0.5 font-medium transition-colors ' +
                (verbalMode === 'imperativo'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700')
              }
            >
              Imperativo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={transformBtnClass}
              disabled={toneMode === 'ai' && isPending}
              onClick={() => handleTone('tone-voseo-cr')}
            >
              Voseo (CR)
            </button>
            <button
              type="button"
              className={transformBtnClass}
              disabled={toneMode === 'ai' && isPending}
              onClick={() => handleTone('tone-tuteo')}
            >
              Tuteo
            </button>
            <button
              type="button"
              className={transformBtnClass}
              disabled={toneMode === 'ai' && isPending}
              onClick={() => handleTone('tone-ustedeo')}
            >
              Ustedeo
            </button>
          </div>
        </div>

        {/* IA + Copiar */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Inteligencia Artificial
            </p>
            <Button
              variant="secondary"
              size="sm"
              loading={isPending}
              onClick={() => handleApi('correct-orthography')}
              className="border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
            >
              Corregir ortografía
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={!text || isPending}
            onClick={handleCopy}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copiar texto
          </Button>
        </div>
      </div>
    </div>
  );
}
