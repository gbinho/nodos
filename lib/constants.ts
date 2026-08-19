export const HOBBY_TAGS = [
  "Tecnologia",
  "Esportes",
  "Artes",
  "Homelab",
  "Ciclismo",
] as const;

export type HobbyTag = (typeof HOBBY_TAGS)[number];

export const TIME_MIN = 15;
export const TIME_MAX = 120;
export const CHECKIN_BUCKET = "checkin-images";
