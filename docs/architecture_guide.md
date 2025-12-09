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

### 2. Writing Data (User Interaction)
1.  **Action**: User creates Project / moves Artboard.
2.  **State Update**: Zustand Store updates UI immediately (Optimistic).
3.  **Local Persist**:
    -   Update Entity in LocalDB (`artboards` or `projects` table).
    -   Add entry to `pendingSync` table.
4.  **Push Sync**: Background worker (debounced 2s) reads `pendingSync`, batches requests, and sends to Supabase.

## Entities Supported
-   **Artboards**: Full CRUD + Sorting.
-   **Projects**: Create, Update Settings/Name.


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



For devs:
Previous features added before 2025.A.4alpha might not have been updated to use this architecture. 