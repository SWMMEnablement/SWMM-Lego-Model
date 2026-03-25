const LS_KEY = "swmm5-lego-autosave";
const LS_SLOTS_KEY = "swmm5-lego-saves";
const SCHEMA_VERSION = 2;

function migrateData(data) {
  if (!data) return data;
  if (!data.version || data.version < 2) {
    data.wqConfig = data.wqConfig || { enabled: false, selectedPollutants: ["TSS"], evapRate: 0.1, temperature: 70 };
    data.cellSpacing = data.cellSpacing || 100;
    data.evapRate = data.evapRate !== undefined ? data.evapRate : 0.1;
    data.unitSystem = data.unitSystem || "us";
    data.version = SCHEMA_VERSION;
  }
  return data;
}

export function saveToLocalStorage(grid, gridSize, stormIdx, cellProps, extras = {}) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      version: SCHEMA_VERSION,
      grid, gridSize, stormIdx, cellProps,
      wqConfig: extras.wqConfig,
      cellSpacing: extras.cellSpacing,
      evapRate: extras.evapRate,
      unitSystem: extras.unitSystem,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) { /* quota exceeded */ }
}

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return migrateData(JSON.parse(raw));
  } catch (e) { localStorage.removeItem(LS_KEY); return null; }
}

export function getSaveSlots() {
  try {
    const raw = localStorage.getItem(LS_SLOTS_KEY);
    return raw ? JSON.parse(raw).map(migrateData) : [];
  } catch (e) { return []; }
}

export function saveToSlot(name, grid, gridSize, stormIdx, cellProps, extras = {}) {
  const slots = getSaveSlots();
  const entry = {
    version: SCHEMA_VERSION,
    name, grid, gridSize, stormIdx, cellProps,
    wqConfig: extras.wqConfig,
    cellSpacing: extras.cellSpacing,
    evapRate: extras.evapRate,
    unitSystem: extras.unitSystem,
    savedAt: new Date().toISOString(),
  };
  const idx = slots.findIndex(s => s.name === name);
  if (idx >= 0) slots[idx] = entry;
  else { if (slots.length >= 5) slots.shift(); slots.push(entry); }
  localStorage.setItem(LS_SLOTS_KEY, JSON.stringify(slots));
}

export function deleteSlot(name) {
  const slots = getSaveSlots().filter(s => s.name !== name);
  localStorage.setItem(LS_SLOTS_KEY, JSON.stringify(slots));
}

export function exportModelJSON(grid, gridSize, stormIdx, cellProps, extras = {}) {
  return JSON.stringify({
    version: SCHEMA_VERSION,
    format: "swmm5-lego-model",
    grid, gridSize, stormIdx, cellProps,
    wqConfig: extras.wqConfig,
    cellSpacing: extras.cellSpacing,
    evapRate: extras.evapRate,
    unitSystem: extras.unitSystem,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importModelJSON(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (data.format !== "swmm5-lego-model" && !data.grid) {
    throw new Error("Not a valid SWMM5 Lego model file");
  }
  return migrateData(data);
}
