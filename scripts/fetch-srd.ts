// Downloads SRD 5.1 classes and feats from the Open5e API and saves the
// fields the sheet needs as JSON in src/data/. The app only ever reads
// those files; it never calls the API.
//
// Run with: npm run fetch-srd

import { mkdir, writeFile } from "node:fs/promises";
import { SRD_DOCUMENT_KEY, transformClasses, transformFeats } from "./srd-transform.ts";

const API = "https://api.open5e.com/v2";
const OUT_DIR = new URL("../src/data/", import.meta.url);

// Follows the API's `next` links until every page has been read.
async function fetchAll(resource: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  let url: string | null = `${API}/${resource}/?document__key=${SRD_DOCUMENT_KEY}&limit=100`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
    const page = (await res.json()) as { results?: unknown[]; next?: string | null };
    rows.push(...(page.results ?? []));
    url = page.next ?? null;
  }
  return rows;
}

async function save(file: string, data: unknown[]) {
  if (data.length === 0) throw new Error(`No ${file} data returned; refusing to overwrite`);
  await writeFile(new URL(file, OUT_DIR), JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote ${data.length} entries to src/data/${file}`);
}

await mkdir(OUT_DIR, { recursive: true });
await save("srd-classes.json", transformClasses(await fetchAll("classes")));
await save("srd-feats.json", transformFeats(await fetchAll("feats")));
