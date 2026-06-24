import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  beansDataSchema,
  brewingMethodsDataSchema,
  flavorNotesDataSchema,
} from "../src/lib/schemas";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../src/data");

const beans = JSON.parse(readFileSync(`${dataDir}/beans.json`, "utf8"));
const methods = JSON.parse(
  readFileSync(`${dataDir}/brewing-methods.json`, "utf8"),
);
const flavorNotes = JSON.parse(
  readFileSync(`${dataDir}/flavor-notes.json`, "utf8"),
);

const beansResult = beansDataSchema.safeParse(beans);
if (!beansResult.success) {
  console.error("beans.json failed validation:");
  console.error(JSON.stringify(beansResult.error.issues, null, 2));
  process.exit(1);
}

const methodsResult = brewingMethodsDataSchema.safeParse(methods);
if (!methodsResult.success) {
  console.error("brewing-methods.json failed validation:");
  console.error(JSON.stringify(methodsResult.error.issues, null, 2));
  process.exit(1);
}

const flavorResult = flavorNotesDataSchema.safeParse(flavorNotes);
if (!flavorResult.success) {
  console.error("flavor-notes.json failed validation:");
  console.error(JSON.stringify(flavorResult.error.issues, null, 2));
  process.exit(1);
}

// Cross-checks
const noteIds = new Set(flavorResult.data.notes.map((n) => n.id));
const subIds = new Set(flavorResult.data.subcategories.map((s) => s.id));
const catIds = new Set(flavorResult.data.categories.map((c) => c.id));

for (const sub of flavorResult.data.subcategories) {
  if (!catIds.has(sub.categoryId)) {
    console.error(
      `subcategory "${sub.id}" references missing category "${sub.categoryId}"`,
    );
    process.exit(1);
  }
}
for (const note of flavorResult.data.notes) {
  if (!subIds.has(note.subcategoryId)) {
    console.error(
      `note "${note.id}" references missing subcategory "${note.subcategoryId}"`,
    );
    process.exit(1);
  }
}

const beanIds = new Set(beansResult.data.map((b) => b.id));
const methodIds = new Set(methodsResult.data.map((m) => m.id));
let beanIssues = 0;
for (const bean of beansResult.data) {
  for (const noteId of bean.flavorNotes) {
    if (!noteIds.has(noteId)) {
      console.error(
        `bean "${bean.id}" has unknown flavor note "${noteId}"`,
      );
      beanIssues++;
    }
  }
  for (const rec of bean.brewingRecommendations) {
    if (!methodIds.has(rec.methodId)) {
      console.error(
        `bean "${bean.id}" has recommendation for unknown method "${rec.methodId}"`,
      );
      beanIssues++;
    }
  }
  for (const relatedId of bean.relatedBeanIds) {
    if (!beanIds.has(relatedId)) {
      console.error(
        `bean "${bean.id}" references unknown related bean "${relatedId}"`,
      );
      beanIssues++;
    }
  }
}
if (beanIssues > 0) process.exit(1);

// --- i18n: overlay completeness + message-key parity ---------------------
//
// English is the source language. Each non-default locale ships overlay files
// keyed by the stable English ids; these checks assert that every id is covered
// and that the UI message catalogs stay perfectly in sync, so a translation can
// never silently fall back to English in production.

const NON_DEFAULT_LOCALES = ["zh-TW"];
const messagesDir = resolve(here, "../messages");
const i18nDir = resolve(here, "../src/data/i18n");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function deepKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    deepKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

let i18nIssues = 0;
const fail = (msg: string) => {
  console.error(msg);
  i18nIssues++;
};

// Countries map: every countryCode present in beans, with en + each locale.
const countries = readJson(`${i18nDir}/countries.json`) as Record<
  string,
  Record<string, string>
>;
const usedCountryCodes = new Set(beansResult.data.map((b) => b.countryCode));
for (const code of usedCountryCodes) {
  const entry = countries[code];
  if (!entry) {
    fail(`countries.json missing entry for "${code}"`);
    continue;
  }
  for (const loc of ["en", ...NON_DEFAULT_LOCALES]) {
    if (!entry[loc]) fail(`countries.json "${code}" missing "${loc}"`);
  }
}

for (const locale of NON_DEFAULT_LOCALES) {
  // Message-key parity with English.
  const en = readJson(`${messagesDir}/en.json`);
  const loc = readJson(`${messagesDir}/${locale}.json`);
  const enKeys = new Set(deepKeys(en));
  const locKeys = new Set(deepKeys(loc));
  for (const k of enKeys) {
    if (!locKeys.has(k)) fail(`messages/${locale}.json missing key "${k}"`);
  }
  for (const k of locKeys) {
    if (!enKeys.has(k)) fail(`messages/${locale}.json has extra key "${k}"`);
  }

  // Bean overlay completeness.
  const beanOverlay = readJson(`${i18nDir}/${locale}/beans.json`) as Record<
    string,
    {
      name?: string;
      region?: string;
      varieties?: string[];
      description?: string;
      funFact?: string;
      tastingNotes?: Record<string, string>;
    }
  >;
  for (const bean of beansResult.data) {
    const o = beanOverlay[bean.id];
    if (!o) {
      fail(`${locale}/beans.json missing bean "${bean.id}"`);
      continue;
    }
    for (const field of ["name", "region", "description"] as const) {
      if (!o[field]) fail(`${locale}/beans.json "${bean.id}" missing ${field}`);
    }
    if (!o.varieties || o.varieties.length !== bean.varieties.length) {
      fail(`${locale}/beans.json "${bean.id}" varieties mismatch`);
    }
    if (bean.funFact && !o.funFact) {
      fail(`${locale}/beans.json "${bean.id}" missing funFact`);
    }
    for (const rec of bean.brewingRecommendations) {
      if (!o.tastingNotes?.[rec.methodId]) {
        fail(
          `${locale}/beans.json "${bean.id}" missing tastingNotes.${rec.methodId}`,
        );
      }
    }
  }

  // Brewing-methods overlay completeness.
  const methodOverlay = readJson(
    `${i18nDir}/${locale}/brewing-methods.json`,
  ) as Record<string, { name?: string; description?: string; equipment?: string[] }>;
  for (const m of methodsResult.data) {
    const o = methodOverlay[m.id];
    if (!o) {
      fail(`${locale}/brewing-methods.json missing method "${m.id}"`);
      continue;
    }
    if (!o.name) fail(`${locale}/brewing-methods.json "${m.id}" missing name`);
    if (!o.description)
      fail(`${locale}/brewing-methods.json "${m.id}" missing description`);
    if (!o.equipment || o.equipment.length !== m.equipment.length) {
      fail(`${locale}/brewing-methods.json "${m.id}" equipment mismatch`);
    }
  }

  // Flavor-notes overlay completeness.
  const flavorOverlay = readJson(`${i18nDir}/${locale}/flavor-notes.json`) as {
    categories?: Record<string, string>;
    subcategories?: Record<string, string>;
    notes?: Record<string, string>;
  };
  for (const c of flavorResult.data.categories) {
    if (!flavorOverlay.categories?.[c.id])
      fail(`${locale}/flavor-notes.json missing category "${c.id}"`);
  }
  for (const s of flavorResult.data.subcategories) {
    if (!flavorOverlay.subcategories?.[s.id])
      fail(`${locale}/flavor-notes.json missing subcategory "${s.id}"`);
  }
  for (const n of flavorResult.data.notes) {
    if (!flavorOverlay.notes?.[n.id])
      fail(`${locale}/flavor-notes.json missing note "${n.id}"`);
  }
}

if (i18nIssues > 0) {
  console.error(`\n${i18nIssues} i18n issue(s) found.`);
  process.exit(1);
}

console.log(
  `OK: ${beans.length} beans, ${methods.length} methods, ` +
    `${flavorResult.data.notes.length} flavor notes (` +
    `${flavorResult.data.categories.length} categories, ` +
    `${flavorResult.data.subcategories.length} subcategories) validated.\n` +
    `OK: i18n overlays + message keys validated for ${NON_DEFAULT_LOCALES.join(", ")}.`,
);
