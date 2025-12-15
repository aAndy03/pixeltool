# Architecture Guide - Local-First & Sync (Version 2025.A.4+)

## Overview
To handle high-frequency interactions (like dragging artboards) without overloading the backend or relying on constant internet connectivity, PixelTool uses a **Local-First Architecture**.

### Core Principles
1.  **ClientDB is the Source of Truth (for the User)**: The application reads and writes primarily to a local browser database (IndexedDB). This ensures near-zero latency and works offline.
2.  **Sync is Background**: Changes are synchronized to the Server (Supabase) in the background asynchronously.
3.  **Optimistic UI**: The UI updates immediately upon user interaction, trusting that the local save will succeed.

## Data Flow

### 1. Reading Data (Page Load / Sync)
1.  **Init**: Application loads.
2.  **Hydrate**: Store fetches data from **LocalDB (Dexie)** immediately.
3.  **Background Sync** (Pull):
    -   Fetch latest data from Supabase.
    -   **Conflict Protection**: Filter out any records that are currently "Dirty" (pending sync) in LocalDB. This ensures user's unsaved changes are NOT overwritten by older server data.
    -   **Merge**: Safe records are bulk-upserted into LocalDB.

### 2. Writing Data (Optimized Bulk Sync)
1.  **Action**: User creates Project / moves Artboard (potentially 100s of times/sec).
2.  **State Update**: UI updates randomly (Optimistic).
3.  **Local Persist**: Changes saved to `Dexie` immediately. Each change adds a row to `pendingSync`.
4.  **Debounce**: Sync Engine waits for **3 Seconds** of inactivity.
5.  **Coalesce**: All 100 moves for "Artboard A" are collapsed into ONE final state.
6.  **Bulk Push**: The engine sends a single `bulkUpsert` request to Supabase containing ALL changed entities.
    -   *Efficiency*: 100 moves = 1 Request.
    -   *Cost*: Minimized Supabase Bill.

### 3. Reading Data (Polled Sync)
-   **Interval**: 5 Minutes (300,000ms).
-   **Purpose**: Fetch changes from other clients/devices.
-   **Conflict Protection**: Ignores any entity currently in `pendingSync` (Local Dirty State protection).
-   **Artboards**: Full CRUD + Sorting.
-   **Projects**: Create, Update Settings/Name.


## Session Persistence (Version 2025.A.5+)
-   **Method**: URL Query Parameter (`?project=<ID>`).
-   **Behavior**:
    -   Opening a project appends `?project=ID` to the URL.
    -   Refreshing the page reads this param and auto-loads the project (Local-First).
    -   Clicking "Back" removes the param.
-   **Benefit**: Users can bookmark specific projects or refresh without losing context.

## Performance & Optimization Strategy (2025.A.12+)

### 1. Auth Optimization
To prevent "Auth Storms" (excessive API calls to verify session), we exclude high-volume asset routes from middleware checks.
-   **Image Proxy**: `/api/image-proxy` is excluded from `middleware.ts` matcher. 
    -   *Impact*: Reduces heavy load on Supabase Auth during scene initialization.

### 2. Rendering Optimization (React Three Fiber)
The Scene is computationally expensive. We employ several strategies to maintain 60FPS:
-   **Memoization**: All leaf canvas components (`ArtboardComponent`, `BackgroundImageLayer`, `ReferenceLayerComponent`) are wrapped in `React.memo()`. This ensures they only re-render when THEIR specific props change, not when the global store updates unrelated items.
-   **Adaptive Resolution**: We use `<AdaptiveDpr />` which lowers the pixel ratio (resolution) during camera movement or heavy interaction, and restores it instantly when static. This provides a "lazy load" feel to zooming/panning and keeps frame rates high.
-   **Bounding Volume Hierarchy (BVH)**: The Scene is wrapped in `<Bvh />` to accelerate raycasting for mouse interactions (hover/click detection).

## How to Add New Features

When adding a new entity (e.g., `Layers`, `Shapes`):

1.  **Define Schema**:
    -   Add table to Supabase (`supabase/schema.sql`).
    -   Add table to LocalDB (`src/lib/db/index.ts`).
2.  **Store Logic**:
    -   Update Zustand store to read/write to LocalDB.
3.  **Sync Logic**:
    -   Ensure the `SyncEngine` handles the new entity type (or make the engine generic).

## Technology Stack
-   **Dexie.js**: Wrapper for IndexedDB (Browser Database).
-   **Zustand**: React State Management.
-   **Supabase**: Backend Database & Auth.


## Unified Layer Ordering (Version 2025.A.11+)

Cross-type layer ordering (artboards, references, images, etc.) uses a central `layer_order` table.

### Schema
-   **`layer_order`** (Supabase) / **`layerOrder`** (Dexie)
    -   `id`, `project_id`, `layer_id`, `layer_type`, `sort_order`

### Flow
1.  **Create layer** → Entry added to both layer table AND `layer_order`
2.  **Delete layer** → Entry removed from both layer table AND `layer_order`
3.  **Reorder** → Layer Panel calls `reorderLayers()` which swaps `sort_order` in `layer_order`
4.  **Display** → Layer Panel reads from `layer_order` to determine unified display order

### Adding New Layer Types
1.  Create table (e.g., `images`) and store (`image-store.ts`)
2.  In create function: also add `layer_order` entry with `layer_type: 'image'`
3.  In remove function: also delete from `layer_order`
4.  Layer Panel automatically includes new type via `layer_order`

### Legacy Support
Layers without `layer_order` entries appear at the end, sorted by their individual `sort_order`.


For devs:
Previous features added before 2025.A.4alpha might not have been updated to use this architecture. 