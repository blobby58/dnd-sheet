// SRD 5.1 classes and feats, bundled with the app. Regenerate the JSON with
// `npm run fetch-srd`; nothing here touches the network.

import classes from "./data/srd-classes.json";
import feats from "./data/srd-feats.json";
import type { SrdClass, SrdFeat } from "./types";

export const SRD_CLASSES = classes as SrdClass[];
export const SRD_FEATS = feats as SrdFeat[];

export function findSrdClass(name: string): SrdClass | undefined {
  const wanted = name.trim().toLowerCase();
  return SRD_CLASSES.find((c) => c.name.toLowerCase() === wanted);
}

export function findSrdFeat(key: string | null): SrdFeat | undefined {
  return key === null ? undefined : SRD_FEATS.find((f) => f.key === key);
}
