# Plan for Phase 1: Responsive UI Adaptation (Desktop → Tablet)

This phase focuses on UI reorganization to support smaller desktop windows and tablets (horizontal/vertical) without breaking visual identity or existing functionality.

## 1. Store & State Adjustments (`src/lib/editor-store.ts`)
- Add more granular responsive state if needed (though existing `leftCollapsed`/`rightCollapsed` are a good start).

## 2. Navigation & Toolbar Overhaul (`src/components/editor/Toolbar.tsx`)
- Implement an **overflow menu** (Dropdown) for secondary functions.
- Define button priorities:
  - **Always Visible:** Selecionar, Cabeamento, Medidas, Adicionar texto, Desfazer, Refazer, Salvar.
  - **Overflow Candidates:** Grid, Snap, Exibir Medidas, Legendas técnicas, Biblioteca (toggle), Propriedades (toggle), Tela cheia, Trash, Exportar PDF, Apoiar.
- Reduce margins and padding responsively using Tailwind classes (`gap-1 md:gap-4`).
- Move zoom controls to a new component for the bottom-right of the viewport.

## 3. Sidebar & Panels Improvements (`src/components/editor/ComponentLibrary.tsx` & `PropertiesPanel.tsx`)
- Add transition logic to reduce padding/margins before collapsing.
- Implement **Drawer behavior** for tablets:
  - Panels start closed or compact.
  - Opening a panel (e.g., to pick a component) should overlap the canvas (absolute positioning) instead of pushing content on tablet/mobile.
  - Auto-close panel after item selection (in `addItemFromCatalog`).

## 4. Canvas & Zoom Controls (`src/components/editor/Canvas.tsx`)
- Implement a dedicated **Viewport Overlay** for visualization controls (Zoom +, Zoom -, Center, Fit, Fullscreen) in the bottom-right corner.
- Ensure the canvas handles smaller viewing areas correctly.

## 5. Responsive Layout in Page Level (`src/routes/editor.tsx`)
- Adjust the layout to accommodate the new viewport controls.
- Implement responsive height for the Ad area (Footer).

## 6. Ad Area Refinement (`src/components/ads/AdSlot.tsx`)
- Add support for a "compact" or "mobile" format that reduces height.

## Technical Details:
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) and `max-w-screen` constraints.
- Use `shadcn/ui` components for the overflow menu (DropdownMenu) if available, or a lightweight custom implementation.
- Adjust the `SANDBOX_PAD` logic if needed to ensure project centering works on smaller viewports.
- Ensure the "hand" cursor logic remains correct (only when dragging/panning).

## Testing Scenarios:
- **Notebook (1366px):** Check for overlapping icons in Toolbar.
- **Tablet Horizontal (~1024px):** Verify panels don't take too much space.
- **Tablet Vertical (~768px):** Verify panels act as Drawers and Toolbar is compact.
- **Zoom/Centering:** Test in all resolutions.
