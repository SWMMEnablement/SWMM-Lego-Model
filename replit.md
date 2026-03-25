# Workspace

## Overview
This project is a pnpm workspace monorepo using TypeScript, designed for building and managing modern web applications. The core focus is on a powerful, interactive stormwater management model builder (`SWMM5 Lego Builder`) and a robust `Express API server`. The project aims to provide an intuitive platform for environmental engineering, leveraging both simplified and professional-grade simulation engines. The business vision is to democratize access to complex hydraulic modeling, enabling faster iteration and better understanding of stormwater systems.

## User Preferences
- I prefer clear and concise explanations.
- I appreciate modular and well-structured code.
- I expect iterative development with regular feedback.
- Please ask for confirmation before making significant architectural changes.

## System Architecture

### UI/UX Decisions
The `SWMM5 Lego Builder` features a distinct LEGO brick aesthetic, employing a vibrant color palette (Red #D01012, Green #70C442/#4B9F4A, Blue #006DB7/#5A93DB, Yellow #F2C717, Orange #FE8A18, Gray #6C6E68, Navy #1B2A34, Off-white #F4F4F4). Key design elements include 3D brick shadows, a green baseplate grid with stud patterns, "instruction booklet" style panels, and specific fonts (Fredoka + Nunito). The interface is fully responsive, adapting to various screen sizes, and includes mobile touch support with long-press functionality for property editing.

### Technical Implementations & Feature Specifications

**SWMM5 Lego Builder (`artifacts/swmm5-lego`)**:
- **Interactive Grid Editor**: Allows painting surfaces, nodes, and links for stormwater network creation.
- **Simulation Engines**:
    - **Quick Sim**: A simplified JavaScript engine for rapid, approximate hydrological feedback (SCS Curve Number, Manning's equation, kinematic wave).
    - **EPA SWMM5 WASM**: Full EPA SWMM5 v5.2 solver compiled to WebAssembly for accurate, publication-quality dynamic wave routing, including backwater, surcharge, and reverse flow modeling.
- **Storm Data**: Includes 49+ design storms and 5 continuous multi-day storms.
- **Visualization & Results**: Real-time animated simulation, result charts (system hydrograph, subcatchment, pipe, node), SWMM Inspector for live data, time-series CSV export, and a downloadable HTML Graph Report.
- **Model Management**: Export to .INP format, import .INP files, JSON model export/import, undo/redo functionality (30-step history), and localStorage persistence with RLE grid compression.
- **Advanced Features**: Background map overlay, water quality modeling (pollutant tracking with SWMM5 sections), continuous simulation, custom cell spacing, and model validation with CFL Courant number checks.
- **Core Dependencies**: React, recharts, Vite.
- **Architecture**: Modularized structure separating components, utilities (elements, storms, pollutants, units, demos), simulation logic (hydraulics, simWorker, swmmWasm), parsing (`parseRpt`), validation, and persistence.

**API Server (`artifacts/api-server`)**:
- **Framework**: Express 5 for handling API requests.
- **Routing**: Routes are organized in `src/routes/` with health checks at `/api/health`.
- **Validation**: Uses `@workspace/api-zod` for request and response validation.
- **Persistence**: Integrates with `@workspace/db` for database operations.

**Shared Libraries**:
- **`lib/db`**: Drizzle ORM with PostgreSQL for database interactions and schema definitions.
- **`lib/api-spec`**: Manages OpenAPI 3.1 spec and Orval configuration for API code generation.
- **`lib/api-zod`**: Stores generated Zod schemas for API validation.
- **`lib/api-client-react`**: Provides generated React Query hooks and a fetch client for API interaction.
- **`scripts`**: A utility package for various workspace-level scripts.

### System Design Choices
- **Monorepo**: pnpm workspaces for managing multiple packages, facilitating code sharing and consistent tooling.
- **TypeScript**: Version 5.9 for strong typing across the entire monorepo.
- **Build System**: esbuild for CJS bundles, Vite for frontend, and `tsc --build` for typechecking with `emitDeclarationOnly`.
- **Composite Projects**: Leveraging TypeScript's `composite: true` and project references for efficient cross-package type checking and build order management.

## External Dependencies
- **Monorepo Tool**: pnpm workspaces
- **Node.js**: Version 24
- **TypeScript**: Version 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API Codegen**: Orval (from OpenAPI spec)
- **Frontend Framework**: React
- **Build Tools**: Vite, esbuild
- **Charting Library**: recharts
- **WASM**: EPA SWMM5 v5.2.4 compiled to WebAssembly (Emscripten)