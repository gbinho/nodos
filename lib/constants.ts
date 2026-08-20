export const HOBBY_TAGS = [
  "Programação",
  "Homelab",
  "Impressão 3D",
  "Ciclismo",
  "Leitura",
] as const;

export type HobbyTag = (typeof HOBBY_TAGS)[number];

export const TIME_MIN = 15;
export const TIME_MAX = 120;
export const TIME_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
export const CHECKIN_BUCKET = "checkin-images";

export function xpForMinutes(minutes: number) {
  const xpByTime = {
    15: 5,
    30: 10,
    45: 15,
    60: 20,
    90: 30,
    120: 40,
  } as const;

  return xpByTime[minutes as keyof typeof xpByTime] ?? 5;
}
