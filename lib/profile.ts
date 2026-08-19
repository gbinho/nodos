export type Profile = {
  handle: string;
  displayName: string;
  subtitle: string;
  level: number;
  xp: number;
  rank: string | null;
};

export const emptyProfile: Profile = {
  handle: "voce",
  displayName: "Você",
  subtitle: "Seu quarto ainda está vazio.",
  level: 1,
  xp: 0,
  rank: null,
};

export const EMPTY_HEATMAP_DAYS = 84;
