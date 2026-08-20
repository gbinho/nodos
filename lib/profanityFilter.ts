const blockedTerms = [
  "idiota", "imbecil", "retardado", "retardada", "otario", "otaria", "babaca", "bosta", "merda", "porra", "caralho", "foder", "foda-se", "fodase", "puta", "puto", "viado", "vadia", "arrombado", "arrombada", "racista", "nazista", "fuck", "fucking", "shit", "bitch", "asshole", "bastard", "dumbass", "idiot", "moron", "retard", "whore", "slut", "nigger", "faggot",
];

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[01!@$]/g, (value) => ({ "0": "o", "1": "i", "!": "i", "@": "a", "$": "s" })[value] ?? value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function hasProfanity(text: string) {
  const normalized = normalize(text);
  return blockedTerms.some((term) => normalized.includes(normalize(term)));
}

export function cleanProfanity(text: string) {
  let result = text;
  for (const term of blockedTerms) {
    result = result.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "****");
  }
  return result;
}
