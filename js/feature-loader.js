/**
 * Runtime loader for features/. Each feature is ONE self-contained HTML file
 * (features/<id>.html) mirroring a real constraint of third-party webstores
 * that only let a site owner paste a single code snippet into a page body:
 * no separate files, no ES module imports, no build step.
 *
 * A feature file contains, in any order:
 *   - `<script type="application/json" data-owlpark-manifest>` — metadata
 *     (id, name, description, category, enabledByDefault, requiresReload).
 *     Never executed or re-injected into the live page; parsed once at
 *     discovery time.
 *   - an optional `<style>` block, scoped to a `.owlpark-feat-<id>` class.
 *   - optional markup, wrapped in an element carrying that same class.
 *   - a plain (non-module) `<script>` — an IIFE that defines `activate()`/
 *     `deactivate()`, calls `activate()` itself immediately (so the snippet
 *     works if pasted standalone into any page, with no orchestration), and
 *     registers `{ activate, deactivate }` on `window.__owlParkFeatures[id]`
 *     so this loader can later call `deactivate()`/`activate()` again
 *     without re-injecting the whole snippet.
 *
 * Activating a feature re-creates its non-manifest elements (style, markup,
 * behavior script) fresh and appends them to the document — appending a
 * freshly created <script> element (as opposed to setting innerHTML) is
 * what makes the browser execute it. Deactivating calls the registered
 * `deactivate()` first, then removes every element tagged
 * `data-owlpark-feature="<id>"` as a safety net.
 */

const ENABLED_STORAGE_KEY = "owl-park-enabled-features";
const FEATURES_BASE = "features";
const REGISTRY_KEY = "__owlParkFeatures";

const activeState = new Map(); // feature id -> injected element[]

function registry() {
  window[REGISTRY_KEY] = window[REGISTRY_KEY] || {};
  return window[REGISTRY_KEY];
}

export async function discoverFeatures() {
  const res = await fetch(`${FEATURES_BASE}/index.json`);
  if (!res.ok)
    throw new Error(`Failed to load features/index.json: ${res.status}`);
  const files = await res.json();
  const manifests = await Promise.all(
    files.map(async (file) => {
      const res = await fetch(`${FEATURES_BASE}/${file}`);
      if (!res.ok) {
        console.warn(`Skipping feature file "${file}": not found`);
        return null;
      }
      const rawText = await res.text();
      const doc = new DOMParser().parseFromString(rawText, "text/html");
      const manifestEl = doc.querySelector("[data-owlpark-manifest]");
      if (!manifestEl) {
        console.warn(`Skipping feature file "${file}": no manifest block`);
        return null;
      }
      const manifest = JSON.parse(manifestEl.textContent);
      return { ...manifest, file, rawText };
    }),
  );
  return manifests.filter(Boolean);
}

function readEnabledMap() {
  try {
    const raw = localStorage.getItem(ENABLED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeEnabledMap(map) {
  localStorage.setItem(ENABLED_STORAGE_KEY, JSON.stringify(map));
}

/** Resolve whether a feature should be on, honoring stored overrides over enabledByDefault. */
export function isEnabled(feature) {
  const map = readEnabledMap();
  if (Object.prototype.hasOwnProperty.call(map, feature.id)) {
    return !!map[feature.id];
  }
  return !!feature.enabledByDefault;
}

export function setEnabledPersisted(featureId, enabled) {
  const map = readEnabledMap();
  map[featureId] = enabled;
  writeEnabledMap(map);
}

/** Re-creates every non-manifest node from a feature's snippet and appends it, live. */
function injectSnippet(feature) {
  // Force everything into a known <body>: a fragment that starts with
  // <script>/<style> and has no markup would otherwise get silently
  // classified as <head> content by the HTML parsing algorithm, which
  // means plain `parsed.body.childNodes` would miss it entirely.
  const parsed = new DOMParser().parseFromString(
    "<!doctype html><html><body>" + feature.rawText + "</body></html>",
    "text/html",
  );
  const nodes = Array.from(parsed.body.childNodes).filter(
    (n) => n.nodeType === Node.ELEMENT_NODE,
  );
  const root = document.getElementById("feature-root") || document.body;
  const appended = [];

  for (const node of nodes) {
    if (node.hasAttribute && node.hasAttribute("data-owlpark-manifest")) {
      continue; // metadata only, never live-injected
    }
    if (node.tagName === "SCRIPT") {
      const script = document.createElement("script");
      for (const attr of node.attributes) {
        script.setAttribute(attr.name, attr.value);
      }
      script.textContent = node.textContent;
      script.setAttribute("data-owlpark-feature", feature.id);
      document.body.appendChild(script); // creating+appending (not innerHTML) triggers execution
      appended.push(script);
    } else if (node.tagName === "STYLE") {
      node.setAttribute("data-owlpark-feature", feature.id);
      document.head.appendChild(node);
      appended.push(node);
    } else {
      node.setAttribute("data-owlpark-feature", feature.id);
      root.appendChild(node);
      appended.push(node);
    }
  }
  return appended;
}

export async function activateFeature(feature) {
  if (activeState.has(feature.id)) return; // already on
  const appended = injectSnippet(feature);
  activeState.set(feature.id, appended);
}

export async function deactivateFeature(feature) {
  if (!activeState.has(feature.id)) return; // already off

  const entry = registry()[feature.id];
  if (entry && typeof entry.deactivate === "function") {
    try {
      entry.deactivate();
    } catch (err) {
      console.error(`Feature "${feature.id}" threw during deactivate`, err);
    }
  }
  delete registry()[feature.id];

  document
    .querySelectorAll(`[data-owlpark-feature="${feature.id}"]`)
    .forEach((el) => el.remove());

  activeState.delete(feature.id);
}

export async function toggleFeature(feature, enabled) {
  if (enabled) {
    await activateFeature(feature);
  } else {
    await deactivateFeature(feature);
  }
  setEnabledPersisted(feature.id, enabled);
}

/** Discover all features and activate whichever are currently enabled. Call once per page load. */
export async function applyEnabledFeatures() {
  const features = await discoverFeatures();
  for (const feature of features) {
    if (isEnabled(feature)) {
      try {
        await activateFeature(feature);
      } catch (err) {
        console.error(`Failed to activate feature "${feature.id}"`, err);
      }
    }
  }
  return features;
}
