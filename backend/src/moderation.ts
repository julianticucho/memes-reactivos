const DRUGS = [
  "droga",
  "marihuana",
  "cannabis",
  "weed",
  "porro",
  "canuto",
  "hachis",
  "cocaina",
  "pasta base",
  "crack",
  "extasis",
  "mdma",
  "lsd",
  "heroina",
  "metanfetamina",
  "anfetamina",
  "ketamina",
  "fentanilo",
  "opio",
  "pasta",
];

const WEAPONS = [
  "arma",
  "fusil",
  "pistola",
  "revolver",
  "rifle",
  "escopeta",
  "municion",
  "explosivo",
];

const RESTRICTED = [
  "alcohol",
  "cerveza",
  "pisco",
  "vodka",
  "whisky",
  "vape",
  "vapeador",
  "cigarrillo",
  "tramadol",
  "clonazepam",
  "rivotril",
  "metilfenidato",
  "ritalin",
  "receta medica",
];

const FLAGGED_TERMS = [...DRUGS, ...WEAPONS, ...RESTRICTED];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$]/g, (char) => LEET[char])
    .replace(/[^a-z\s]/g, " ")
    .replace(/(.)\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const PATTERNS = FLAGGED_TERMS.map(
  (term) => new RegExp(`(^| )${normalize(term)}(s|es)?( |$)`),
);

export const needsReview = (...texts: string[]): boolean => {
  const text = normalize(texts.join(" "));
  return PATTERNS.some((pattern) => pattern.test(text));
};
