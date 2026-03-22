# SWMM5 LEGO Builder — Technical Handover Document

**Project**: SWMM5 LEGO Builder  
**Version**: 1.0  
**Date**: March 2026  
**Platform**: Browser-based (no backend required)  
**URL**: Deployed on Replit  

---

## 1. Executive Summary

SWMM5 LEGO Builder is an interactive, browser-based stormwater management model builder with a full LEGO visual aesthetic. Users paint surfaces, place drainage nodes, draw pipe networks, run hydrologic/hydraulic simulations, and export/import EPA SWMM5 .INP files — all entirely in the browser with zero backend dependencies.

The application features **dual simulation engines**: a lightweight JavaScript engine for instant visual feedback and the official EPA SWMM5 v5.2 solver compiled to WebAssembly for publication-quality results.

---

## 2. Architecture Overview

### 2.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 (JSX) |
| **Build Tool** | Vite 7.3 |
| **Charts** | Recharts 2.15 |
| **Styling** | Inline styles + LegoToolbar.css |
| **Fonts** | Google Fonts (Fredoka, Nunito) |
| **WASM Engine** | EPA SWMM5 v5.2.4 (Emscripten 2.0.10) |
| **Persistence** | localStorage (auto-save + 5 named slots) |
| **Hosting** | Replit (pnpm monorepo) |
| **Package Manager** | pnpm workspaces |

### 2.2 Monorepo Location

```
artifacts/swmm5-lego/          # Root of the SWMM5 LEGO Builder artifact
├── src/
│   ├── components/
│   │   ├── SWMM5LegoBuilder.jsx   # Main component (~2200 lines)
│   │   └── LegoToolbar.css        # LEGO 3D brick styling (542 lines)
│   ├── lib/
│   │   ├── elements.js            # Element definitions & grid config
│   │   ├── storms.js              # 49 design storm profiles
│   │   ├── demos.js               # 13 demo model builders
│   │   ├── hydraulics.js          # JS simulation engine (SCS-CN + Manning's)
│   │   ├── swmmWasm.js            # EPA SWMM5 WASM wrapper
│   │   ├── parseRpt.js            # .RPT text report parser
│   │   ├── parseOut.js            # .OUT binary output parser
│   │   ├── exportInp.js           # .INP file generator
│   │   ├── importInp.js           # .INP file importer
│   │   ├── exportCsv.js           # CSV time-series exporter
│   │   ├── exportHtmlReport.js    # Standalone HTML graph report generator
│   │   ├── validation.js          # Model validation + auto-fix
│   │   └── persistence.js         # localStorage save/load
│   ├── hooks/
│   │   └── use-mobile.tsx         # Responsive breakpoint hook
│   └── App.tsx / main.tsx         # App entry points
├── public/
│   ├── swmm/
│   │   ├── js.wasm                # EPA SWMM5 v5.2.4 WebAssembly binary (452 KB)
│   │   └── js.js                  # Emscripten JS glue code (109 KB)
│   └── docs/                      # Downloadable documentation files
└── package.json                   # Dependencies & scripts
```

**Total codebase size**: ~5,000 lines across 15 source files.

---

## 3. Core Concepts

### 3.1 The Grid System

The application uses a 2D grid (default 20x20, configurable up to 50x50) where each cell represents a 100 ft x 100 ft area. Users "paint" cells with elements:

- **Surfaces** (subcatchment generators): Grass, Roof, Road, Driveway, Sidewalk, LID Pond, Permeable Paving, Green Roof, Rain Barrel, Swale
- **Nodes** (drainage junctions): Manhole, Inlet, Outfall, Storage, Divider
- **Links** (conveyance connections): Pipe, Channel, Pump, Orifice, Weir

Each element has default hydraulic properties (Curve Number, Manning's n, imperviousness, pipe diameter, max depth) that can be overridden per-cell via right-click context menu.

### 3.2 Element Definitions (`elements.js`)

All elements are defined in the `EL` object with properties:

```
EL = {
  grass:   { cat: "surface", cn: 61, pI: 0,   n: 0.15, clr: "#70C442", ico: "🌿" },
  roof:    { cat: "surface", cn: 98, pI: 100, n: 0.012, clr: "#D01012", ico: "🏠" },
  road:    { cat: "surface", cn: 98, pI: 100, n: 0.013, clr: "#6C6E68", ico: "🏗️" },
  manhole: { cat: "node",   maxDepth: 6, clr: "#006DB7", ico: "🔵" },
  pipe:    { cat: "link",   diam: 1.5, n: 0.013, clr: "#8B4513", ico: "🟫" },
  outfall: { cat: "node",   maxDepth: 0, clr: "#D01012", ico: "🔴" },
  // ... (10 surface types, 5 node types, 5 link types)
}
```

**Grid utilities**: `getGrid()` / `setGrid(v)` manage the global grid dimension. Categories are defined in the `CATS` object.

### 3.3 Subcatchment Delineation

When a simulation runs, the system automatically delineates subcatchments using flood-fill. Contiguous groups of surface cells are identified and assigned to the nearest downstream node. Each subcatchment's area, weighted Curve Number, percent imperviousness, and Manning's n are computed from its constituent cells.

### 3.4 Network Tracing

The system traces "chains" of link cells to connect nodes. It identifies pipe runs between manholes/inlets/outfalls and calculates slopes based on grid row (using elevation = row-based gradient). This allows users to simply paint pipe cells between nodes and the system automatically generates proper SWMM conduit definitions.

---

## 4. Dual Simulation Engines

### 4.1 Quick Sim Engine (`hydraulics.js`)

A lightweight JavaScript engine for instant visual feedback during model design.

**Method**:
- SCS Curve Number method for infiltration losses
- Manning's equation for overland flow and pipe flow
- 15-second routing timestep with kinematic wave routing
- Explicit forward time-stepping

**Key Functions**:
- `runSWMM5(grid, storm, cellProps)` — Main entry point; returns `simResult` object
- `buildModel(grid, cellProps)` — Converts 2D grid to node/conduit/subcatchment graph
- `manningPipe(depth, diam, slope, n)` — Circular pipe flow calculation
- `manningOverland(depth, width, slope, n)` — Overland sheet flow
- `cnInfiltration(rain, cn)` — SCS Curve Number runoff calculation

**Output** (`simResult`):
- `systemHistory[]` — Array of `{t, totalRunoff, totalPipeFlow, outfallFlow, rainfall}` per timestep
- `subcatchments[]` — Each with `.history[]` of `{t, runoff, rain}`
- `nodes[]` — Each with `.history[]` of `{t, depth, flow}`
- `conduits[]` — Each with `.history[]` of `{t, flow, velocity}`
- `allNodes[]` — All nodes with position and live state

**Limitations**: No backwater effects, no surcharge, no reverse flow, no storage routing. Kinematic wave only.

### 4.2 EPA SWMM5 WASM Engine (`swmmWasm.js`)

The official EPA SWMM5 v5.2.4 solver, compiled from C to WebAssembly using Emscripten 2.0.10.

**Architecture**:
1. `initSwmmWasm()` — Dynamically loads `public/swmm/js.js`, configures `window.Module` with Emscripten MEMFS virtual filesystem
2. `runSwmmWasm(inpContent)` — Writes input to virtual `/input.inp`, calls `swmm_run()` via `cwrap`, reads `/output.rpt` (text) and `/output.out` (binary), returns both

**Capabilities**: Dynamic Wave routing (full Saint-Venant equations), backwater effects, surcharge, reverse flow, storage routing, pressure flow.

**Output**: Standard EPA SWMM5 `.rpt` text report + `.out` binary time-series file.

---

## 5. File Format Handling

### 5.1 INP Export (`exportInp.js`)

`exportINP(grid, storm, cellProps)` generates a standard EPA SWMM5 `.inp` file containing these sections:

`[TITLE]`, `[OPTIONS]`, `[RAINGAGES]`, `[SUBCATCHMENTS]`, `[SUBAREAS]`, `[INFILTRATION]`, `[JUNCTIONS]`, `[OUTFALLS]`, `[STORAGE]`, `[CONDUITS]`, `[PUMPS]`, `[ORIFICES]`, `[WEIRS]`, `[XSECTIONS]`, `[TIMESERIES]`, `[COORDINATES]`, `[REPORT]`

The exporter maps grid coordinates to spatial coordinates (100 ft spacing), calculates subcatchment areas from cell counts, and formats the selected storm as a SWMM5 time series.

### 5.2 INP Import (`importInp.js`)

`importINP(text, requestedSize)` parses standard `.inp` files and maps them back to the LEGO grid:

- Reads `[COORDINATES]` to establish spatial layout
- Scales coordinates to fit the target grid size
- Maps SWMM objects to element types (junctions → manholes, conduits → pipes, etc.)
- Uses `tracePath()` to draw pipe paths on the grid between node coordinates
- Supports auto-sizing based on coordinate range

### 5.3 RPT Parser (`parseRpt.js`)

`parseRpt(rptText)` extracts summary tables from the EPA SWMM5 text report:

- Analysis Options, Subcatchment Runoff Summary, Node Depth/Inflow/Flooding Summaries
- Outfall Loading Summary, Link Flow Summary, Conduit/Node Surcharge Summaries
- Pumping Summary, Runoff Quantity Continuity, Flow Routing Continuity
- Errors, Warnings

### 5.4 Binary Output Parser (`parseOut.js`)

`parseOutBinary(buffer)` reads the EPA SWMM5 binary `.out` file to extract full time-series data:

**File Format** (SWMM5 v5.2):
```
Header:     Magic (0x1ED0EE1A) | Version | Flow Units | Object Counts
ID Names:   Subcatchment/Node/Link/Pollutant string IDs
Properties: Object property codes + values (area, invert, max depth, etc.)
Variables:  Reporting variable codes for each object type
Metadata:   Start date (double) | Report step (seconds)
Results:    For each period: date + subcatch/node/link/system float arrays
Footer:     Offsets | Period count | Error code | Magic
```

**Extracted Variables**:
- **Subcatchments** (8 vars): rainfall, snowDepth, evapLoss, infilLoss, runoff, gwOutflow, gwElev, soilMoisture
- **Nodes** (6 vars): depth, head, volume, lateralInflow, totalInflow, flooding
- **Links** (5 vars): flow, depth, velocity, volume, capacity
- **System** (14 vars): airTemp, rainfall, snowDepth, evapInfilLoss, runoff, dryWeatherInflow, gwInflow, rdiiInflow, directInflow, totalLatInflow, flooding, outfallFlow, storageVolume, actualEvap

### 5.5 CSV Export (`exportCsv.js`)

`exportResultsCsv(simResult, tab)` exports time-series data from Quick Sim results for system, subcatchment, node, or pipe tabs.

### 5.6 HTML Graph Report (`exportHtmlReport.js`)

`generateHtmlReport(simResult, storm, gridSize, networkStats)` produces a self-contained HTML file with:

- LEGO-themed header with storm/model metadata
- 9 peak-value stat cards
- 4 interactive Canvas-rendered charts: System Hydrograph, Rainfall Hyetograph, Subcatchment Runoff, Node Depths, Conduit Flows
- Print-friendly CSS, responsive layout
- Zero external dependencies (all rendering via Canvas API)

---

## 6. Design Storms (`storms.js`)

The application includes **49 pre-defined design storm profiles** organized by region:

| Region | Storms |
|--------|--------|
| **US Standards** | SCS Type I, IA, II, III; NOAA Atlas 14; Huff Quartiles 1-4; USACE Standard Project; PMP (HMR 51/52) |
| **US State/Local** | Florida FDOT Zones 1-5; Texas TxDOT; Denver UDFCD |
| **Europe** | UK FSR/FEH; Chicago Storm; French Desbordes; German DWA-A 531, Euler Type I/II; Dutch STOWA; Italian Mediterranean |
| **Asia-Pacific** | Japan JMA, AMeDAS, Baiu, Typhoon; China GB 50014, Pearl River Delta; India IMD Monsoon; Singapore PUB; Australian ARR |
| **Other** | South African Huff; Canadian CDA, MTO; Block (Uniform); Double Peak; Yen & Chow Triangular |

Each storm is defined as a fractional cumulative distribution with a total depth, and is converted to a SWMM5-compatible intensity time series during export.

---

## 7. Demo Scenarios (`demos.js`)

13 pre-built scenarios demonstrate various drainage challenges:

| Demo | Description |
|------|-------------|
| **Residential** | Suburban neighborhood with houses, lawns, and trunk sewer |
| **Parking Lot** | Impervious commercial lot with LID treatment |
| **Green Infra** | Bioretention focus, minimal impervious cover |
| **Highway** | Corridor with shoulders, medians, roadside drainage |
| **Mixed-Use** | Downtown block with buildings and LID plaza |
| **School Campus** | Athletic fields, buildings, dual outfalls |
| **Industrial** | Large warehouse roofs, heavy-duty drainage |
| **Hillside** | Steep terrain, cascading manholes, erosion control |
| **Hospital** | Emergency access, redundant drainage |
| **Dual Outfall** | Split drainage basins, separate discharge points |
| **Stadium (Full)** | Large-scale roof drainage, concourse collection |
| **Stadium Simple** | Simplified stadium variant |
| **Minimal Test** | Minimal 3-cell test model |

Each demo is a builder function that programmatically fills a grid with elements and returns the grid array.

---

## 8. Model Validation (`validation.js`)

### 8.1 Validation Checks

`validateModel(grid)` returns `{ errors, warnings, warnCells }`:

**Errors** (block simulation):
- Empty model (no elements placed)
- No outfall node present
- No link elements (pipes/channels) present
- Disconnected pipes (link cells not connecting two nodes)

**Warnings** (informational):
- No junction nodes (only outfall)
- Flat pipes (zero slope from row-based elevation)
- CFL/Courant number exceeds 1.0 (numerical instability risk)
- Very short or very long pipe runs

### 8.2 Auto-Fix

`autoFix(grid)` attempts automatic corrections:
- Adds a missing outfall at the bottom-right of the network
- Adds a missing inlet if no junction nodes exist
- Returns `{ grid, fixes }` with a log of changes made

### 8.3 Visual Feedback

Validation results are shown on the grid:
- **Red borders**: Error cells
- **Orange borders**: CFL/stability warning cells
- **Yellow borders**: Cells with custom property overrides

---

## 9. User Interface

### 9.1 Layout

**Desktop** (>768px): Three-column layout
- **Left Panel** (210px): Element palette, surface/node/link categories, paint/erase toggle
- **Center**: Interactive grid with LEGO baseplate aesthetic
- **Right Sidebar** (280px): Storm selector, simulation controls, result charts, inspector, documentation

**Mobile** (<768px): Single-column stacked layout with dynamic cell sizing.

### 9.2 Visual Theme — LEGO Brick Aesthetic

Every UI element is styled to look like LEGO bricks:

| Element | LEGO Treatment |
|---------|---------------|
| **Grid cells** | Multi-layer box-shadows (bright top-left + deep bottom-right), gradient overlay sheen, circular stud on each filled cell with specular highlight |
| **Palette buttons** | 3D depth borders, press animations, stud dots |
| **Toolbar** | Brick-style depth shadows, LEGO color coding |
| **Side panels** | White "instruction booklet" style with gray borders |
| **Baseplate** | Green background with radial-gradient stud pattern |

**Color Palette**:
- Red: `#D01012` (errors, outfalls, EPA results)
- Green: `#70C442` / `#4B9F4A` (grass, success, subcatchments)
- Blue: `#006DB7` / `#5A93DB` (pipes, nodes, system charts)
- Yellow: `#F2C717` (warnings, highlights, tutorial)
- Orange: `#FE8A18` (CFL warnings, node results)
- Gray: `#6C6E68` (roads, neutral elements)
- Navy: `#1B2A34` (text, dark backgrounds)
- Off-white: `#F4F4F4` (panel backgrounds)

**Fonts**: Fredoka (headings, buttons), Nunito (body text)

### 9.3 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Z` | Undo |
| `Space` | Toggle paint/erase mode |
| `Del` | Activate erase mode |
| `R` | Run Quick Sim |
| `Esc` | Close open panels |
| `1-9` | Select surface element |
| `Shift+1-5` | Select node element |
| `Q` / `W` / `E` | Select Pipe / Channel / Pump |

### 9.4 Mobile Support

- Single-finger paint/drag on grid with `touch-action: none`
- Long-press (500ms) opens property editor on placed cells
- Dynamic cell sizing scales grid to fit screen width
- Hidden panels: DUAL ENGINES, SHORTCUTS
- Responsive modal/overlay widths

---

## 10. Simulation Workflow

### 10.1 Quick Sim Flow

1. User clicks **QUICK SIM** button
2. `validateModel(grid)` checks for errors
3. `runSWMM5(grid, storm, cellProps)` executes:
   - `buildModel()` converts grid to node/conduit/subcatchment graph
   - Time-stepping loop (15s intervals) computes infiltration, runoff, pipe routing
   - Returns `simResult` with full time-series history
4. Animation loop (`requestAnimationFrame`) advances `simStep`, updating:
   - Grid cell highlights (flow intensity colors, depth-based opacity)
   - Chart data (system hydrograph, subcatchment, node, pipe tabs)
   - Inspector panel (live element values)
5. Results panel shows peak statistics and export buttons

### 10.2 EPA SWMM5 Flow

1. User clicks **EPA SWMM5** button
2. `validateModel(grid)` checks for errors
3. `exportINP(grid, storm, cellProps)` generates `.inp` text
4. `runSwmmWasm(inpContent)`:
   - `initSwmmWasm()` loads WASM module (first run only)
   - Writes `.inp` to Emscripten virtual filesystem
   - Calls `swmm_run()` via `cwrap`
   - Reads `.rpt` (text) and `.out` (binary) from virtual FS
   - Returns `{ returnCode, rpt, outBinary }`
5. `parseRpt(rpt)` extracts summary tables
6. `parseOutBinary(outBinary)` extracts full time-series
7. Results panel shows:
   - **Summary tab**: Analysis options, object counts, peak values, bar charts
   - **Subcatchments tab**: Runoff summary table
   - **Nodes tab**: Depth, inflow, flooding, surcharge tables
   - **Links tab**: Flow, surcharge, pumping tables
   - **Time Series tab**: Interactive recharts (system flows, rainfall, node depths, node inflows, link flows, link velocities, subcatchment runoff)
   - **Continuity tab**: Mass balance (runoff quantity, flow routing)
   - **Raw RPT tab**: Full text report with download

---

## 11. Data Persistence

### 11.1 localStorage Structure

| Key | Contents |
|-----|----------|
| `swmm5-lego-autosave` | Auto-saved on every change: `{ grid, gridSize, stormIdx, cellProps }` |
| `swmm5-lego-saves` | Array of up to 5 named save slots: `[{ name, grid, gridSize, stormIdx, cellProps, date }]` |

### 11.2 Save/Load Functions (`persistence.js`)

- `saveToLocalStorage(grid, gridSize, stormIdx, cellProps)` — Auto-save
- `loadFromLocalStorage()` — Load auto-save
- `getSaveSlots()` — List named slots
- `saveToSlot(name, grid, gridSize, stormIdx, cellProps)` — Save to named slot
- `deleteSlot(name)` — Delete a named slot

---

## 12. Export Capabilities

| Format | Function | Description |
|--------|----------|-------------|
| **SWMM5 .INP** | `exportINP()` | Standard EPA SWMM5 input file, compatible with desktop SWMM5 |
| **SWMM5 .RPT** | Download button | Raw text report from EPA WASM engine |
| **CSV** | `exportResultsCsv()` | Time-series data for system/subcatchment/node/pipe tabs |
| **HTML Report** | `generateHtmlReport()` | Self-contained HTML with Canvas-rendered charts, printable |

---

## 13. Import Capabilities

| Format | Function | Description |
|--------|----------|-------------|
| **SWMM5 .INP** | `importINP()` | Parses standard .inp files, maps coordinates to grid, places elements |

---

## 14. Dependencies

### 14.1 Runtime Dependencies (Key)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.x | UI framework |
| `recharts` | ^2.15.2 | Chart components (LineChart, BarChart, ResponsiveContainer) |
| `vite` | 7.3.x | Build tool and dev server |
| `wouter` | ^3.3.5 | Lightweight routing |

### 14.2 WASM Binary

| File | Size | Source |
|------|------|--------|
| `public/swmm/js.wasm` | 452 KB | EPA SWMM5 v5.2.4, compiled with Emscripten 2.0.10 |
| `public/swmm/js.js` | 109 KB | Emscripten JS glue code |

Source: [OpenWaterAnalytics/Stormwater-Management-Model](https://github.com/OpenWaterAnalytics/Stormwater-Management-Model) v5.2.4

---

## 15. Known Limitations

1. **Quick Sim engine**: Kinematic wave only — no backwater, surcharge, reverse flow, or storage routing
2. **Grid-based model**: Limited to regular grid layouts; cannot represent arbitrary network topologies
3. **Single rain gage**: All subcatchments share the same rainfall time series
4. **No water quality**: Pollutant transport not implemented
5. **Cell-based elevation**: Elevation derived from grid row position (top = high, bottom = low)
6. **localStorage only**: No cloud save, no multi-user collaboration
7. **Browser memory**: Very large models (50x50 grid with long simulations) may consume significant browser memory

---

## 16. Development & Build

### 16.1 Local Development

```bash
pnpm --filter @workspace/swmm5-lego run dev
```

Starts Vite dev server on the assigned PORT with hot module replacement.

### 16.2 Production Build

```bash
pnpm --filter @workspace/swmm5-lego run build
```

Outputs optimized static files to `dist/`.

### 16.3 Type Checking

```bash
pnpm --filter @workspace/swmm5-lego run typecheck
```

---

## 17. Future Enhancement Opportunities

- Cloud save/share via URL
- Water quality simulation support
- Custom irregular grid/mesh support
- Real-time collaboration
- Integration with GIS data sources
- LID (Low Impact Development) performance comparison tool
- PDF report generation
- 3D visualization of the drainage network

---

## 18. Contact & Resources

- **EPA SWMM5 Documentation**: [https://www.epa.gov/water-research/storm-water-management-model-swmm](https://www.epa.gov/water-research/storm-water-management-model-swmm)
- **SWMM5 Source Code**: [https://github.com/OpenWaterAnalytics/Stormwater-Management-Model](https://github.com/OpenWaterAnalytics/Stormwater-Management-Model)
- **Recharts Documentation**: [https://recharts.org](https://recharts.org)

---

*This document was generated as a technical handover for the SWMM5 LEGO Builder application. It covers the complete architecture, all features, data flows, and implementation details needed to understand, maintain, and extend the application.*
