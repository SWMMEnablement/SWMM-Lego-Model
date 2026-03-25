const LS_KEY = "swmm5-lego-autosave";
const LS_SLOTS_KEY = "swmm5-lego-saves";
const SCHEMA_VERSION = 2;
const MAX_SLOTS = 5;

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

function validateSaveData(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.grid)) return false;
  if (!data.grid.every(row => Array.isArray(row))) return false;
  if (typeof data.gridSize !== "number" || data.gridSize < 5 || data.gridSize > 100) return false;
  return true;
}

function estimateStorageSize(data) {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return JSON.stringify(data).length * 2;
  }
}

function compressGrid(grid) {
  const flat = [];
  for (const row of grid) {
    for (const cell of row) {
      flat.push(cell || 0);
    }
  }
  const rle = [];
  let i = 0;
  while (i < flat.length) {
    const val = flat[i];
    let count = 1;
    while (i + count < flat.length && flat[i + count] === val && count < 255) count++;
    rle.push([val, count]);
    i += count;
  }
  return rle;
}

function decompressGrid(rle, gridSize) {
  const flat = [];
  for (const [val, count] of rle) {
    for (let i = 0; i < count; i++) flat.push(val === 0 ? null : val);
  }
  const grid = [];
  for (let r = 0; r < gridSize; r++) {
    grid.push(flat.slice(r * gridSize, (r + 1) * gridSize));
  }
  return grid;
}

function tryCompress(data) {
  const compressed = { ...data, _compressed: true, _gridRLE: compressGrid(data.grid) };
  delete compressed.grid;
  const compStr = JSON.stringify(compressed);
  const rawStr = JSON.stringify(data);
  if (compStr.length < rawStr.length) return compStr;
  return rawStr;
}

function tryDecompress(raw) {
  const data = JSON.parse(raw);
  if (data._compressed && data._gridRLE) {
    data.grid = decompressGrid(data._gridRLE, data.gridSize);
    delete data._compressed;
    delete data._gridRLE;
  }
  return data;
}

export function saveToLocalStorage(grid, gridSize, stormIdx, cellProps, extras = {}) {
  const data = {
    version: SCHEMA_VERSION,
    grid, gridSize, stormIdx, cellProps,
    wqConfig: extras.wqConfig,
    cellSpacing: extras.cellSpacing,
    evapRate: extras.evapRate,
    unitSystem: extras.unitSystem,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LS_KEY, tryCompress(data));
    return { success: true };
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014) {
      return { success: false, error: "quota", message: "Browser storage is full. Consider deleting unused save slots or exporting your model as JSON." };
    }
    return { success: false, error: "unknown", message: e.message };
  }
}

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = tryDecompress(raw);
    const migrated = migrateData(data);
    if (!validateSaveData(migrated)) {
      console.warn("Invalid autosave data, ignoring");
      return null;
    }
    return migrated;
  } catch (e) {
    console.warn("Failed to load autosave:", e.message);
    localStorage.removeItem(LS_KEY);
    return null;
  }
}

export function getSaveSlots() {
  try {
    const raw = localStorage.getItem(LS_SLOTS_KEY);
    if (!raw) return [];
    const slots = JSON.parse(raw);
    return slots.map(s => {
      if (s._compressed && s._gridRLE) {
        s.grid = decompressGrid(s._gridRLE, s.gridSize);
        delete s._compressed;
        delete s._gridRLE;
      }
      return migrateData(s);
    }).filter(s => validateSaveData(s));
  } catch (e) {
    console.warn("Failed to load save slots:", e.message);
    return [];
  }
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
  else { if (slots.length >= MAX_SLOTS) slots.shift(); slots.push(entry); }
  try {
    const compressed = slots.map(s => {
      const c = { ...s, _compressed: true, _gridRLE: compressGrid(s.grid) };
      delete c.grid;
      return c;
    });
    localStorage.setItem(LS_SLOTS_KEY, JSON.stringify(compressed));
    return { success: true };
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014) {
      return { success: false, error: "quota", message: "Browser storage is full. Delete unused save slots first." };
    }
    return { success: false, error: "unknown", message: e.message };
  }
}

export function deleteSlot(name) {
  const slots = getSaveSlots().filter(s => s.name !== name);
  try {
    localStorage.setItem(LS_SLOTS_KEY, JSON.stringify(slots));
  } catch { /* ignore */ }
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
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error("Invalid JSON format");
  }
  if (data.format !== "swmm5-lego-model" && !data.grid) {
    throw new Error("Not a valid SWMM5 Lego model file");
  }
  const migrated = migrateData(data);
  if (!validateSaveData(migrated)) {
    throw new Error("File contains invalid or corrupted model data");
  }
  return migrated;
}

export function getStorageUsage() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      total += (localStorage.getItem(key) || "").length * 2;
    }
    return {
      usedBytes: total,
      usedMB: (total / (1024 * 1024)).toFixed(2),
      estimatedMaxMB: 5,
    };
  } catch {
    return { usedBytes: 0, usedMB: "0", estimatedMaxMB: 5 };
  }
}
