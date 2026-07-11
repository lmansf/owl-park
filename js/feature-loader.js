/**
 * Runtime loader for features/. Each feature folder has a manifest.json and,
 * per its "files" entry, optional css/html assets plus a required js entry
 * point exporting `activate(ctx)` / `deactivate(ctx)`.
 *
 * Loader responsibilities: fetch + inject/remove the feature's <style> tag
 * and HTML fragment container, dynamically import its JS module once, and
 * call activate/deactivate on toggle. Everything the loader injects is
 * tagged with data-feature="<id>" so deactivate can always find and strip it,
 * even if a feature's own teardown misses something.
 */

const ENABLED_STORAGE_KEY = "critter-cove-enabled-features";
const FEATURES_BASE = "features";

const moduleCache = new Map(); // feature id -> imported module
const activeState = new Map(); // feature id -> { styleEl, mountEl }

export async function discoverFeatures() {
  const res = await fetch(`${FEATURES_BASE}/index.json`);
  if (!res.ok)
    throw new Error(`Failed to load features/index.json: ${res.status}`);
  const folders = await res.json();
  const manifests = await Promise.all(
    folders.map(async (folder) => {
      const manifestRes = await fetch(
        `${FEATURES_BASE}/${folder}/manifest.json`,
      );
      if (!manifestRes.ok) {
        console.warn(`Skipping feature "${folder}": manifest not found`);
        return null;
      }
      const manifest = await manifestRes.json();
      return { ...manifest, folder };
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

async function getModule(feature) {
  if (!feature.files || !feature.files.js) return null;
  if (moduleCache.has(feature.id)) return moduleCache.get(feature.id);
  const mod = await import(
    `../${FEATURES_BASE}/${feature.folder}/${feature.files.js}`
  );
  moduleCache.set(feature.id, mod);
  return mod;
}

export async function activateFeature(feature) {
  if (activeState.has(feature.id)) return; // already on

  let styleEl = null;
  let mountEl = null;

  if (feature.files && feature.files.css) {
    const cssRes = await fetch(
      `${FEATURES_BASE}/${feature.folder}/${feature.files.css}`,
    );
    const cssText = await cssRes.text();
    styleEl = document.createElement("style");
    styleEl.setAttribute("data-feature", feature.id);
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
  }

  if (feature.files && feature.files.html) {
    const htmlRes = await fetch(
      `${FEATURES_BASE}/${feature.folder}/${feature.files.html}`,
    );
    const htmlText = await htmlRes.text();
    mountEl = document.createElement("div");
    mountEl.className = "feature-mount";
    mountEl.setAttribute("data-feature", feature.id);
    mountEl.innerHTML = htmlText;
    const root = document.getElementById("feature-root") || document.body;
    root.appendChild(mountEl);
  }

  activeState.set(feature.id, { styleEl, mountEl });

  const mod = await getModule(feature);
  if (mod && typeof mod.activate === "function") {
    await mod.activate({ mount: mountEl, featureId: feature.id });
  }
}

export async function deactivateFeature(feature) {
  const state = activeState.get(feature.id);
  if (!state) return; // already off

  const mod = await getModule(feature);
  if (mod && typeof mod.deactivate === "function") {
    try {
      await mod.deactivate({ mount: state.mountEl, featureId: feature.id });
    } catch (err) {
      console.error(`Feature "${feature.id}" threw during deactivate`, err);
    }
  }

  if (state.styleEl) state.styleEl.remove();
  if (state.mountEl) state.mountEl.remove();

  // Belt-and-suspenders: strip any other stray nodes the feature tagged.
  document
    .querySelectorAll(`[data-feature="${feature.id}"]`)
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
