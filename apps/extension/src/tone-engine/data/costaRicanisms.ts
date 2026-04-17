/**
 * Costa Rican vocabulary and expressions that must be preserved as-is during
 * tone transformations. None of these words should be confused with verb forms
 * or replaced by the tone engine.
 */
export const COSTA_RICANISMS: ReadonlySet<string> = new Set([
  // Informal address / discourse markers
  'mae',
  'maje',
  'diay',
  'upe',
  // Greetings / farewells
  'tuanis',
  'pura vida',
  // General vocabulary
  'chunche',
  'güila',
  'guila',
  'birra',
  'guaro',
  'pulpería',
  'pulperia',
  'sodas',
  'soda',
  'brete',
  'harina',
  'jalón',
  'jalon',
  'salado',
  'chiva',
  // Adjective / intensifier
  'chivísimo',
  'chivisimo',
  // Fixed expressions
  'de una',
  'qué chiva',
  'que chiva',
  'pura mierda',
  'a cachete',
  'a todo dar',
  // Filler / pragmatic particles
  'dicho sea de paso',
]);

/**
 * Returns true if the given normalized (lowercase) word or phrase is a
 * Costa Ricanism that must not be modified by the tone engine.
 */
export function isCostaRicanism(word: string): boolean {
  return COSTA_RICANISMS.has(word.toLowerCase());
}
