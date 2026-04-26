'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ProviderCredential, CopyConfig, LocaleCode } from '@edi/shared';
import { transformTextAction, recordLocalUsageAction, type ApiTransformation } from '@/lib/actions/transform';
import { activateCredentialAction } from '@/lib/actions/credentials';
import { Button } from '@/components/ui/Button';
import { renderDiff, parseHtmlToCharTokens, type CharToken } from '@/lib/diff';

// ── Diff animation DOM helper ────────────────────────────────────────────────

function appendCharToken(
  el: HTMLElement,
  token: CharToken,
  currentMark: HTMLElement | null,
): HTMLElement | null {
  if (token.cls) {
    if (currentMark && currentMark.className === token.cls) {
      currentMark.textContent += token.char;
      return currentMark;
    }
    const mark = document.createElement('mark');
    mark.className = token.cls;
    mark.textContent = token.char;
    el.appendChild(mark);
    return mark;
  }
  // Plain text
  const last = el.lastChild;
  if (last && last.nodeType === Node.TEXT_NODE) {
    last.textContent += token.char;
  } else {
    el.appendChild(document.createTextNode(token.char));
  }
  return null;
}

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
  | 'remove-formatting';

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
  'min-h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 ' +
  'inline-flex items-center justify-center ' +
  'transition-colors hover:border-gray-300 hover:bg-gray-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 ' +
  'whitespace-nowrap';

// ── Format style definitions ─────────────────────────────────────────────────

const FORMAT_STYLES: ReadonlyArray<{ key: LocalTransformation; icon: string; name: string; ariaName: string }> = [
  { key: 'uppercase',         icon: 'AA', name: 'Mayúsculas',    ariaName: 'Convertir a mayúsculas'   },
  { key: 'lowercase',         icon: 'aa', name: 'Minúsculas',    ariaName: 'Convertir a minúsculas'   },
  { key: 'sentence-case',     icon: 'Aa', name: 'Tipo Oración', ariaName: 'Convertir a tipo oración' },
  { key: 'remove-formatting', icon: '❌', name: 'Quitar Fmt',   ariaName: 'Quitar formato de texto'   },
];

// ── AI provider/model constants ───────────────────────────────────────────────

const DEFAULT_COPY_CONFIG: CopyConfig = {
  tratamiento: 'voseo',
  modoVerbal: 'imperativo',
  contexto: 'anuncio',
  canal: 'web',
  formalidad: 'medio',
  objetivo: 'convertir',
  intensidadCambio: 'moderada',
};

const COPY_LS_KEY = 'edi-copy-config-default';

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

function voseoLabel(locale: LocaleCode): string {
  if (locale === 'es-CR') return 'Voseo CR';
  if (locale === 'es-419') return 'Voseo';
  return 'Voseo ES';
}

interface TextEditorClientProps {
  activeCredential?: ProviderCredential | null;
  allCredentials?: ProviderCredential[];
  locale?: LocaleCode;
}

export function TextEditorClient({ activeCredential, allCredentials = [], locale = 'es-CR' }: TextEditorClientProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [isPending, startTransition] = useTransition();
  const [isActivating, startActivating] = useTransition();
  const [localActiveId, setLocalActiveId] = useState(activeCredential?.id ?? null);
  const [toneMode, setToneMode] = useState<'local' | 'ai'>('local');
  const [verbalMode, setVerbalMode] = useState<'indicativo' | 'imperativo'>('indicativo');
  const [copyConfig, setCopyConfig] = useState<CopyConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_COPY_CONFIG;
    try {
      const saved = localStorage.getItem(COPY_LS_KEY);
      return saved ? (JSON.parse(saved) as CopyConfig) : DEFAULT_COPY_CONFIG;
    } catch {
      return DEFAULT_COPY_CONFIG;
    }
  });

  // Diff panel state
  const [diffData, setDiffData] = useState<{ origHtml: string; transHtml: string } | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [credPickerOpen, setCredPickerOpen] = useState(false);
  const origRef = useRef<HTMLDivElement>(null);
  const transRef = useRef<HTMLDivElement>(null);
  const animIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a ref to latest text to avoid stale closures in sync handlers
  const textRef = useRef(text);
  textRef.current = text;

  const localActive = allCredentials.find((c) => c.id === localActiveId) ?? activeCredential;

  function updateCopyConfig(patch: Partial<CopyConfig>) {
    setCopyConfig((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(COPY_LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function handleActivate(id: string) {
    if (id === localActiveId || isActivating) return;
    setLocalActiveId(id);
    startActivating(async () => {
      await activateCredentialAction(id);
      router.refresh();
    });
  }

  function handleLocal(t: LocalTransformation) {
    const prev = textRef.current;
    const start = Date.now();
    const next = applyLocalTransform(prev, t);
    setText(next);
    const diff = renderDiff(prev, next);
    setDiffData(prev !== next ? { origHtml: diff.originalHtml, transHtml: diff.transformedHtml } : null);
    setStatus(null);
    void recordLocalUsageAction(t, Date.now() - start, 'web-editor');
  }

  function handleTone(t: ToneTransformation) {
    if (toneMode === 'local') {
      const targetMap: Record<ToneTransformation, ToneTarget> = {
        'tone-voseo-cr': 'voseo',
        'tone-tuteo': 'tuteo',
        'tone-ustedeo': 'ustedeo',
      };
      const prev = textRef.current;
      const start = Date.now();
      const next = applyLocalTone(prev, targetMap[t], verbalMode);
      setText(next);
      const diff = renderDiff(prev, next);
      setDiffData(prev !== next ? { origHtml: diff.originalHtml, transHtml: diff.transformedHtml } : null);
      setStatus(null);
      void recordLocalUsageAction(t, Date.now() - start, 'web-editor');
    } else {
      handleApi(t);
    }
  }

  function handleApi(transformation: ApiTransformation, cfgOverride?: CopyConfig) {
    if (!text.trim()) {
      setStatus({ type: 'warning', message: 'Escribí o pegá texto primero.' });
      return;
    }
    const capturedText = text;
    setStatus(null);
    startTransition(async () => {
      const cfg = cfgOverride ?? (transformation === 'copy-writing-cr' ? copyConfig : undefined);
      const res = await transformTextAction(capturedText, transformation, verbalMode, cfg, locale);
      if (res.error) {
        setStatus({
          type: 'error',
          message: FRIENDLY_ERRORS[res.error] ?? `Error: ${res.error}. Intentá de nuevo.`,
        });
        return;
      }
      if (typeof res.result === 'string') {
        setText(res.result);
        const diff = renderDiff(capturedText, res.result);
        setDiffData(
          capturedText !== res.result
            ? { origHtml: diff.originalHtml, transHtml: diff.transformedHtml }
            : null,
        );
        if (res.source === 'ai-fallback' && res.warnings?.[0]) {
          setStatus({ type: 'warning', message: res.warnings[0].message });
        }
      }
    });
  }

  // ── Diff animation effect ──────────────────────────────────────────────────

  useEffect(() => {
    if (!diffData) return;

    const origEl = origRef.current;
    const transEl = transRef.current;
    if (!origEl || !transEl) return;

    if (animIdRef.current !== null) {
      clearTimeout(animIdRef.current);
      animIdRef.current = null;
    }

    origEl.innerHTML = '';
    transEl.innerHTML = '';
    origEl.classList.add('edi-diff-animating');
    transEl.classList.add('edi-diff-animating');

    setDiffOpen(true);

    const origTokens = parseHtmlToCharTokens(diffData.origHtml);
    const transTokens = parseHtmlToCharTokens(diffData.transHtml);
    const maxLen = Math.max(origTokens.length, transTokens.length);

    if (maxLen === 0) {
      origEl.classList.remove('edi-diff-animating');
      transEl.classList.remove('edi-diff-animating');
      return;
    }

    const CHAR_DELAY = Math.max(6, Math.min(30, Math.round(800 / maxLen)));
    let idx = 0;
    let origMark: HTMLElement | null = null;
    let transMark: HTMLElement | null = null;

    function step() {
      if (idx < origTokens.length) {
        origMark = appendCharToken(origEl!, origTokens[idx]!, origMark);
      }
      if (idx < transTokens.length) {
        transMark = appendCharToken(transEl!, transTokens[idx]!, transMark);
      }
      idx++;
      if (idx < maxLen) {
        animIdRef.current = setTimeout(step, CHAR_DELAY);
      } else {
        animIdRef.current = null;
        origEl!.classList.remove('edi-diff-animating');
        transEl!.classList.remove('edi-diff-animating');
      }
    }

    step();

    return () => {
      if (animIdRef.current !== null) {
        clearTimeout(animIdRef.current);
        animIdRef.current = null;
      }
    };
  }, [diffData]);

  function handleDiffToggle() {
    if (diffOpen && animIdRef.current !== null) {
      // Finish animation instantly when collapsing
      clearTimeout(animIdRef.current);
      animIdRef.current = null;
      if (origRef.current && diffData) {
        origRef.current.innerHTML = diffData.origHtml;
        origRef.current.classList.remove('edi-diff-animating');
      }
      if (transRef.current && diffData) {
        transRef.current.innerHTML = diffData.transHtml;
        transRef.current.classList.remove('edi-diff-animating');
      }
    }
    setDiffOpen((v) => !v);
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
      ? 'text-red-600 dark:text-red-400'
      : status?.type === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : status?.type === 'success'
          ? 'text-green-600 dark:text-green-400'
          : 'text-gray-500 dark:text-slate-400';

  const statusMessage = status?.message ?? (isPending ? 'Transformando con IA…' : '');

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7 dark:border-slate-700 dark:bg-slate-900">

      {/* AI credential switcher */}
      {allCredentials.length > 0 ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-900/50">
          <button
            type="button"
            onClick={() => setCredPickerOpen((v) => !v)}
            aria-expanded={credPickerOpen}
            aria-controls="web-cred-picker"
            className="flex w-full items-center justify-between gap-2 bg-gradient-to-r from-indigo-50/80 to-white px-3 py-2.5 text-left sm:px-4 dark:from-indigo-950/40 dark:to-slate-900"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 shrink-0">Proveedor IA</span>
              {localActive && (
                <span className="truncate text-[11px] text-gray-500 dark:text-slate-400">
                  {localActive.selectedModel ?? AI_MODELS[localActive.provider] ?? '—'}
                </span>
              )}
            </div>
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
              className={'shrink-0 transition-transform duration-200 text-indigo-400 ' + (credPickerOpen ? 'rotate-180' : '')}
            >
              <path d="M3.5 5.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {credPickerOpen && (
            <div id="web-cred-picker" className="border-t border-indigo-100 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 dark:border-indigo-900/50">
              <div className="flex flex-wrap items-center gap-2">
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
                        'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ' +
                        (isActive
                          ? 'border-indigo-400 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400 dark:border-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-200 dark:ring-indigo-500'
                          : cred.isExpired
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300')
                      }
                    >
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" aria-hidden="true" />
                      )}
                      <span>{PROVIDER_LABELS[cred.provider] ?? cred.provider}</span>
                      <span className="text-gray-400 dark:text-slate-600">·</span>
                      <span>{cred.label}</span>
                    </button>
                  );
                })}
              </div>
              {isActivating && (
                <span className="mt-2 block w-full text-xs text-gray-500 dark:text-slate-400">Cambiando…</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Sin clave de IA configurada.{' '}
            <Link href="/credentials/new" className="text-indigo-600 hover:underline">
              Agregar clave
            </Link>
          </span>
        </div>
      )}

      {/* Textarea */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="edi-web-textarea" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
            Texto a editar
          </label>
          <span className="text-xs text-gray-400 dark:text-slate-500">{text.length} caracteres</span>
        </div>
        <textarea
          id="edi-web-textarea"
          value={text}
          onChange={(e) => { setText(e.target.value); setDiffData(null); }}
          rows={7}
          spellCheck
          lang="es"
          placeholder="Escribí o pegá tu texto aquí…"
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
        />
      </div>

      {/* Status region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`mb-2 min-h-[1.25rem] text-sm ${statusMessage ? statusColorClass : ''}`}
      >
        {statusMessage}
      </div>

      {/* Diff panel */}
      {diffData && (
        <div className="mb-4">
          <button
            type="button"
            aria-expanded={diffOpen}
            aria-controls="edi-web-diff-panel"
            onClick={handleDiffToggle}
            className="mb-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
          >
            Ver cambios{' '}
            <span aria-hidden="true">{diffOpen ? '▴' : '▾'}</span>
          </button>
          <div
            id="edi-web-diff-panel"
            role="region"
            aria-label="Comparación de cambios"
            className={diffOpen ? '' : 'hidden'}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="border-b border-gray-200 bg-red-50/40 px-3 py-2 dark:border-slate-700 dark:bg-red-950/30">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-red-400">
                  Original
                </span>
                <div
                  ref={origRef}
                  className="edi-diff-content whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-gray-700 dark:text-slate-300"
                />
              </div>
              <div className="bg-green-50/40 px-3 py-2 dark:bg-green-950/30">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                  Transformado
                </span>
                <div
                  ref={transRef}
                  className="edi-diff-content whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-gray-700 dark:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action groups */}
      <div className="space-y-4">
        {/* Formato */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Formato
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Transformaciones de formato">
            {FORMAT_STYLES.map(({ key, icon, name, ariaName }) => (
              <button
                key={key}
                type="button"
                title={name}
                aria-label={ariaName}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold leading-none tracking-tight transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:focus-visible:ring-offset-slate-900"
                onClick={() => handleLocal(key)}
              >
                <span aria-hidden="true">{icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tono */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Tono
            </p>
            <div
              role="group"
              aria-label="Motor de transformación de tono"
              className="flex overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs dark:border-slate-700/60 dark:bg-slate-800/40"
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
            className="mb-2 flex w-fit overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs dark:border-slate-700/60 dark:bg-slate-800/40"
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
                  ? 'bg-white text-green-700 shadow-sm dark:bg-slate-700 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200')
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
              {voseoLabel(locale)}
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

        {/* Motor de Copy CR */}
        <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 sm:p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            ✦ Motor de Copy
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Contexto</label>
              <select
                value={copyConfig.contexto}
                onChange={(e) => updateCopyConfig({ contexto: e.target.value as CopyConfig['contexto'] })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="anuncio">Anuncio</option>
                <option value="landing">Landing</option>
                <option value="boton">Botón / CTA</option>
                <option value="formulario">Formulario</option>
                <option value="notificacion">Notificación</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Objetivo</label>
              <select
                value={copyConfig.objetivo}
                onChange={(e) => updateCopyConfig({ objetivo: e.target.value as CopyConfig['objetivo'] })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="convertir">Convertir</option>
                <option value="persuadir">Persuadir</option>
                <option value="informar">Informar</option>
                <option value="guiar">Guiar</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Formalidad</label>
              <select
                value={copyConfig.formalidad}
                onChange={(e) => updateCopyConfig({ formalidad: e.target.value as CopyConfig['formalidad'] })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="medio">Medio</option>
                <option value="bajo">Informal</option>
                <option value="alto">Formal</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Tratamiento</label>
              <select
                value={copyConfig.tratamiento}
                onChange={(e) => updateCopyConfig({ tratamiento: e.target.value as CopyConfig['tratamiento'] })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="voseo">{voseoLabel(locale)}</option>
                <option value="tuteo">Tuteo</option>
                <option value="ustedeo">Ustedeo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Canal</label>
              <select
                value={copyConfig.canal ?? 'web'}
                onChange={(e) => updateCopyConfig({ canal: e.target.value as CopyConfig['canal'] })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="web">Web</option>
                <option value="meta-ads">Meta Ads</option>
                <option value="email">Email</option>
                <option value="app">App</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="display">Display</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Intensidad</label>
              <select
                value={copyConfig.intensidadCambio}
                onChange={(e) => updateCopyConfig({ intensidadCambio: e.target.value as CopyConfig['intensidadCambio'] })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="moderada">Moderada</option>
                <option value="minima">Mínima</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={isPending}
            onClick={() => handleApi('copy-writing-cr')}
            className="border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            Generar Copy
          </Button>
        </div>

        {/* IA + Copiar */}
        <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-slate-700/60 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button
              variant="secondary"
              size="sm"
              loading={isPending}
              onClick={() => handleApi('correct-orthography')}
              className="border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:border-violet-700 dark:hover:bg-violet-950"
            >
              Corregir ortografía
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={!text || isPending}
            onClick={handleCopy}
            className="w-full justify-center sm:w-auto"
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
