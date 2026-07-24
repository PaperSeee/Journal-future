// Tilt — taxonomie des déclencheurs, intensités et conseils anti-tilt.
// Données statiques : aucune dépendance base de données. Les entrées de tilt
// sont journalisées côté client (localStorage) — voir components/TiltJournal.tsx.

export type TiltTrigger = {
  id: string;
  label: string;
  /** Ce qui se passe dans la tête au moment du tilt. */
  tell: string;
  /** Le contre-protocole concret, à appliquer sur le moment. */
  antidote: string;
};

/** Les déclencheurs de tilt les plus fréquents en trading intraday. */
export const TILT_TRIGGERS: TiltTrigger[] = [
  {
    id: "revenge",
    label: "Revenge trade",
    tell: "Tu viens de perdre et tu veux « récupérer » tout de suite. Le trade suivant n'est plus dans le plan — il sert à réparer l'ego, pas à suivre le modèle.",
    antidote:
      "Ferme la plateforme 15 min. Le marché sera encore là. Tu ne rentres au prochain trade que s'il coche TOUTE la checklist du Plan — sinon ce n'est pas un trade, c'est un pansement.",
  },
  {
    id: "fomo",
    label: "FOMO / peur de rater",
    tell: "Le prix part sans toi, tu sautes dedans en retard, sans POI ni invalidation claire. Tu chasses la bougie.",
    antidote:
      "Un move raté n'est jamais le dernier. Note le setup manqué dans le Journal au lieu de le trader. Si tu n'as pas ton POI et ton stop AVANT le mouvement, tu ne rentres pas.",
  },
  {
    id: "overtrading",
    label: "Overtrading",
    tell: "Tu enchaînes les trades sans qu'aucun setup A ne se présente. Le compte devient un jeu, chaque bougie est une « occasion ».",
    antidote:
      "Fixe un plafond de trades/jour AVANT la session (2–3 max). Une fois atteint, la journée est finie, gagnant ou perdant. Le meilleur trade est souvent celui qu'on ne prend pas.",
  },
  {
    id: "size-up",
    label: "Sur-taille / hausse de lot",
    tell: "Après une perte (ou un gain), tu montes la taille pour « aller plus vite ». Le risque n'est plus fixe, il suit l'émotion.",
    antidote:
      "Le risque par trade est une CONSTANTE, pas une variable d'humeur. Reviens à ton R fixe. Si tu ressens le besoin de sizer up, c'est le signal exact qu'il faut sizer down ou arrêter.",
  },
  {
    id: "moved-stop",
    label: "Stop déplacé / retiré",
    tell: "Le prix approche du stop, tu l'éloignes « juste un peu » en espérant un retour. Tu transformes une perte valide en perte incontrôlée.",
    antidote:
      "Le stop est sacré. On ne l'élargit JAMAIS en cours de trade. Une perte au stop planifié = un bon trade. Si tu déplaces le stop, note-le comme entorse au plan dans le Journal (followedPlan = non).",
  },
  {
    id: "early-exit",
    label: "Sortie anticipée (peur)",
    tell: "Le trade va dans ton sens mais tu coupes avant le TP par peur que ça reparte. Tu laisses le R sur la table par anxiété.",
    antidote:
      "Tu as défini le TP pour une raison, quand tu étais calme. Laisse le trade respirer jusqu'à l'invalidation ou la cible. Gérer par la peur, c'est saboter un edge valide.",
  },
  {
    id: "boredom",
    label: "Ennui / pas de setup",
    tell: "Rien ne se passe, tu t'ennuies, tu prends un trade « pour voir ». L'absence d'action devient inconfortable.",
    antidote:
      "L'attente fait partie du métier. Pas de setup = pas de trade, c'est une décision gagnante. Ferme le graphique, fais autre chose, reviens à la prochaine fenêtre de session.",
  },
  {
    id: "external",
    label: "État externe (fatigue, stress, news)",
    tell: "Tu trades fatigué, énervé, ou juste après une news qui t'a secoué. La décision ne vient pas d'un cerveau clair.",
    antidote:
      "Ton edge suppose un mental neutre. Si tu n'es pas à 100 % (sommeil, émotion, alcool, dispute), tu ne trades pas. Le marché ne récompense pas le courage, il punit l'impulsivité.",
  },
];

export const TRIGGER_BY_ID: Record<string, TiltTrigger> = Object.fromEntries(
  TILT_TRIGGERS.map((t) => [t.id, t]),
);

export type TiltIntensity = 1 | 2 | 3;

export const INTENSITY_META: Record<
  TiltIntensity,
  { label: string; hint: string; tone: "warn" | "loss" | "critical" }
> = {
  1: { label: "Léger", hint: "Une pointe d'émotion — repérée à temps.", tone: "warn" },
  2: { label: "Moyen", hint: "Ça a influencé une décision.", tone: "loss" },
  3: { label: "Fort", hint: "Tu as pris le contrôle des mains du plan.", tone: "critical" },
};

/** Règles universelles anti-tilt — le protocole de reprise en main. */
export const RESET_PROTOCOL: { step: string; detail: string }[] = [
  {
    step: "Stop immédiat",
    detail: "Dès que tu identifies le tilt : mains OFF le clavier. Aucun ordre pendant 15 minutes.",
  },
  {
    step: "Nomme l'émotion",
    detail: "Écris ce que tu ressens (revenge, FOMO, peur…). Nommer = reprendre le contrôle du cerveau rationnel.",
  },
  {
    step: "Relis ton Plan",
    detail: "Ouvre la page Plan. Le prochain trade coche-t-il TOUS les non-négociables ? Sinon, il n'existe pas.",
  },
  {
    step: "Décide : continuer ou couper",
    detail: "Si tu as atteint ton plafond de pertes/trades du jour, la session est terminée. Sans négociation.",
  },
];

/**
 * Un conseil synthétique basé sur l'historique récent des tilts.
 * Détecte les schémas répétitifs pour renvoyer le bon message.
 */
export function coachingInsight(entries: { triggerId: string; intensity: number; date: string }[]): {
  headline: string;
  body: string;
} {
  if (entries.length === 0) {
    return {
      headline: "Rien à signaler — reste vigilant",
      body: "Aucun tilt journalisé. Le meilleur trader n'est pas celui qui ne tilt jamais, c'est celui qui le repère en 2 secondes et coupe. Continue à noter, même les tilts « légers ».",
    };
  }

  // Compte par déclencheur.
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.triggerId, (counts.get(e.triggerId) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [topId, topCount] = sorted[0] ?? ["", 0];
  const top = topId ? TRIGGER_BY_ID[topId] : undefined;

  // Tilts des 7 derniers jours.
  const weekAgo = Date.now() - 7 * 24 * 3600_000;
  const recent = entries.filter((e) => new Date(e.date).getTime() >= weekAgo);
  const strongRecent = recent.filter((e) => e.intensity >= 3).length;

  if (strongRecent >= 2) {
    return {
      headline: "🚨 Plusieurs tilts forts cette semaine",
      body: `Tu as ${strongRecent} tilts d'intensité forte sur 7 jours. Ce n'est plus du bruit, c'est un pattern qui coûte cher. Réduis la taille de moitié cette semaine et impose-toi un plafond strict de 2 trades/jour, le temps de reprendre la main.`,
    };
  }

  if (top && topCount >= 3) {
    return {
      headline: `Ton schéma récurrent : ${top.label}`,
      body: `« ${top.label} » revient ${topCount} fois dans ton journal. ${top.antidote}`,
    };
  }

  return {
    headline: "Tu repères tes tilts — c'est déjà 80 % du travail",
    body: top
      ? `Ton déclencheur le plus fréquent reste « ${top.label} ». Garde son antidote en tête : ${top.antidote}`
      : "Continue à journaliser à chaud. Le simple fait d'écrire le tilt casse déjà la spirale émotionnelle.",
  };
}
