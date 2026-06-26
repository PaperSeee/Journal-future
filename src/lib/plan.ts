// The trading plan content — single source so the Plan page stays in sync.

export const MODEL_NAME = "Delivery entre imbalances HTF — entrée sur réaction";

export const MODEL_DESCRIPTION = `Le setup = 2 zones HTF. Le prix livre d'une zone HTF (H4) vers une autre (H1) : l'une est la cible, l'autre l'entrée. Condition de validité = alignement : en réagissant, le POI d'entrée doit envoyer le prix vers la cible.

Entrée sur FVG obligatoire — le prix tape la FVG et réagit. Entrée au marché sur la réaction, jugée en M15 max (jamais en dessous). SL au-dessus / en-dessous de la FVG = mon 1R. Pas de trade après 21h.`;

export interface ChecklistItem {
  id: string;
  title: string;
  detail: string;
}

export const CHECKLIST: ChecklistItem[] = [
  {
    id: "bias",
    title: "Biais HTF clair",
    detail: "Je sais où le prix veut livrer (le draw).",
  },
  {
    id: "zones",
    title: "Mes 2 zones (cible + entrée)",
    detail:
      "POI d'entrée net (imbalance, gap ou devil's mark), aligné vers la cible.",
  },
  {
    id: "reaction",
    title: "Entrée sur FVG OBLIGATOIRE",
    detail: "Le prix tape la FVG et réagit (bougie franche, idéalement sans mèche).",
  },
  {
    id: "entry",
    title: "Entrée au marché sur la réaction",
    detail: "Jugée en M15 max (jamais en dessous).",
  },
  {
    id: "stop",
    title: "SL au-dessus / en-dessous de la FVG = 1R",
    detail: "Grosse zone → raffiner.",
  },
  {
    id: "target",
    title: "Cible = la zone opposée",
    detail: "RR dynamique, pas de 2R fixe.",
  },
  {
    id: "onetrade",
    title: "1 trade par POI",
    detail:
      "La cible n'est pas une 2e entrée. Si SL → je ne reprends pas ce niveau.",
  },
  {
    id: "noclose",
    title: "Pas de trade après 21h",
    detail: "Rien après 21h.",
  },
];

export const VALID_LOSS = `Un SL qui respecte les 8 points n'est pas une erreur. Le modèle perd ~1 fois sur 2 et reste gagnant grâce au RR. Pas de doute, pas de revenge, ne rien changer.`;

export const NON_NEGOTIABLES: string[] = [
  "Entrée sur FVG obligatoire (pas de FVG = pas de trade)",
  "Entrée M15 max",
  "SL au-dessus / en-dessous de la FVG",
  "Pas de trade après 21h",
  "1 trade par POI (zéro revenge sur un niveau échoué)",
  "Risque 0,5% fixe (micros MGC / MNQ)",
  "Pas de réaction = pas de trade",
  "Journaliser chaque trade",
];

export interface Hypothesis {
  tag: string;
  title: string;
  detail: string;
}

export const HYPOTHESES: Hypothesis[] = [
  {
    tag: "①",
    title: "Creux overnight (~00–04 UTC)",
    detail: "NQ peu liquide → SL fréquents.",
  },
  {
    tag: "②",
    title: "Grosse zone",
    detail: "Entrée imprécise → raffiner (CE / POI LTF plus petit).",
  },
  {
    tag: "③",
    title: "Devil's mark",
    detail:
      "Seul POI sans base mécanique prouvée → à valider dans les stats avant d'en faire une règle.",
  },
];
