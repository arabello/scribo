# Blog Post Assistant Skeleton Layout Implementation Plan

## Overview
Create a 3-column desktop layout skeleton for the blog post review assistant using shadcn/ui components and Tailwind CSS v4. The layout includes subdivided sections with borders and titles but no business logic.

## Current State Analysis
- Fresh React Router v7 app with basic home route
- shadcn/ui configured (New York style) but no components installed yet
- Tailwind CSS v4 with design tokens configured in `app/app.css`
- Path alias `~/` maps to `./app/`
- No components directory exists

### Key Discoveries:
- `components.json` configured with aliases: `~/components`, `~/lib/utils`
- TypeScript strict mode enabled - need explicit types
- Project uses full function declarations with JSX.Element return type

## Desired End State
A full-page 3-column layout with:
- **Left column (1 unit)**: Metadata (30% height) + Suggestions (70% height)
- **Center column (2 units)**: Full-height scrollable text area + floating toolbar at bottom
- **Right column (1 unit)**: Guidelines (50% height) + Checklist (50% height)
- All sections have titles and borders for identification
- Desktop-only (no responsive behavior needed)
- Toolbar floats over center column with margin, doesn't scroll with content

### Verification:
- Run `pnpm dev` and navigate to `http://localhost:5173`
- Verify 3-column layout with 1:2:1 proportions
- Verify left column has 30:70 split, right column has 50:50 split
- Verify center column scrolls independently
- Verify toolbar stays fixed at bottom of center column when scrolling

## What We're NOT Doing
- No business logic or state management
- No API integration or data fetching
- No interactive features beyond basic component rendering
- No responsive/mobile layout
- No content in sections (empty skeletons only)

## Implementation Phases

### Phase 1: Install shadcn/ui Components
**Goal**: Add required UI components from shadcn/ui library

**Steps**:
1. Install Textarea component: `pnpm dlx shadcn@latest add textarea`
2. Install Button component: `pnpm dlx shadcn@latest add button`

**Files Created**:
- `app/components/ui/textarea.tsx`
- `app/components/ui/button.tsx`
- `app/lib/utils.ts` (if not exists)

**Verification**: Components directory exists with UI components

---

### Phase 2: Create Section Components
**Goal**: Create reusable section components for each area of the layout

**Steps**:
1. Create `app/components/metadata-section.tsx`
   - Export function `MetadataSection(): JSX.Element`
   - Simple div with border and title
   - Empty content area

2. Create `app/components/suggestions-section.tsx`
   - Export function `SuggestionsSection(): JSX.Element`
   - Simple div with border and title
   - Empty content area

3. Create `app/components/text-editor-section.tsx`
   - Export function `TextEditorSection(): JSX.Element`
   - Use Textarea component with placeholder
   - Full height with scroll behavior
   - Title "Blog Post Content"

4. Create `app/components/guidelines-section.tsx`
   - Export function `GuidelinesSection(): JSX.Element`
   - Simple div with border and title
   - Empty content area

5. Create `app/components/checklist-section.tsx`
   - Export function `ChecklistSection(): JSX.Element`
   - Simple div with border and title
   - Empty content area

6. Create `app/components/toolbar.tsx`
   - Export function `Toolbar(): JSX.Element`
   - Use Button component with placeholder text
   - Styled for floating appearance

**Files Created**:
- `app/components/metadata-section.tsx`
- `app/components/suggestions-section.tsx`
- `app/components/text-editor-section.tsx`
- `app/components/guidelines-section.tsx`
- `app/components/checklist-section.tsx`
- `app/components/toolbar.tsx`

**Verification**: All component files exist and export typed functions

---

### Phase 3: Implement Layout in home.tsx
**Goal**: Compose all sections into the 3-column grid layout

**Steps**:
1. Update `app/routes/home.tsx` with layout structure:
   - Use CSS Grid with `grid-cols-4` (1:2:1 ratio using 4 columns)
   - Left column: `col-span-1` with flex column for 30:70 split
   - Center column: `col-span-2` with relative positioning for toolbar
   - Right column: `col-span-1` with flex column for 50:50 split
   - Full viewport height: `h-screen`
   - Add gap between columns: `gap-4`
   - Add padding: `p-4`

2. Left column structure:
   - Flex container with `flex-col gap-4`
   - MetadataSection with `h-[30%]`
   - SuggestionsSection with `flex-1` (takes remaining 70%)

3. Center column structure:
   - Relative container for toolbar positioning
   - TextEditorSection with full height
   - Toolbar positioned absolute at bottom with margin

4. Right column structure:
   - Flex container with `flex-col gap-4`
   - GuidelinesSection with `flex-1` (50%)
   - ChecklistSection with `flex-1` (50%)

**Files Modified**:
- `app/routes/home.tsx`

**Key Implementation Details**:
```tsx
// Grid layout
<div className="grid grid-cols-4 gap-4 h-screen p-4">
  {/* Left column - 1 unit */}
  <div className="col-span-1 flex flex-col gap-4">
    <div className="h-[30%]">
      <MetadataSection />
    </div>
    <div className="flex-1">
      <SuggestionsSection />
    </div>
  </div>
  
  {/* Center column - 2 units */}
  <div className="col-span-2 relative">
    <TextEditorSection />
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <Toolbar />
    </div>
  </div>
  
  {/* Right column - 1 unit */}
  <div className="col-span-1 flex flex-col gap-4">
    <div className="flex-1">
      <GuidelinesSection />
    </div>
    <div className="flex-1">
      <ChecklistSection />
    </div>
  </div>
</div>
```

**Verification**: Layout renders with correct proportions and structure

---

### Phase 4: Style Sections with Borders and Titles
**Goal**: Add visual distinction to each section with borders and clear titles

**Steps**:
1. Update each section component with simple styling:
   - Border using `border border-border`
   - Rounded corners using `rounded-lg`
   - Title with padding and bottom border
   - Empty content area with padding
   - Proper height classes to fill container

2. Ensure TextEditorSection:
   - Textarea fills available space
   - Has visible border
   - Scrollable by default

3. Add consistent spacing:
   - Padding inside sections
   - Gap between sections
   - Margin around toolbar

**Files Modified**:
- All section component files

**Verification**: All sections have visible borders and titles

---

### Phase 5: Position Floating Toolbar
**Goal**: Ensure toolbar floats over center column and doesn't scroll with content

**Steps**:
1. Position toolbar with absolute positioning:
   - `absolute bottom-4` for margin from bottom
   - `left-1/2 -translate-x-1/2` for horizontal centering
   - `z-10` to ensure it's above text area

2. Style toolbar for visibility:
   - Add shadow for floating effect
   - Background color to stand out
   - Padding and rounded corners

3. Ensure center column has `relative` positioning for toolbar anchor

**Files Modified**:
- `app/components/toolbar.tsx`
- `app/routes/home.tsx` (if positioning adjustments needed)

**Verification**: 
- Toolbar stays at bottom of center column when scrolling
- Toolbar is centered horizontally
- Toolbar has floating appearance

---

## Testing Strategy

### Manual Testing
1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:5173`
3. Verify layout structure:
   - 3 columns visible with correct proportions (1:2:1)
   - Left column: Metadata smaller than Suggestions (30:70)
   - Right column: Guidelines and Checklist equal height (50:50)
4. Test scrolling:
   - Add temporary long text to center textarea
   - Verify center column scrolls
   - Verify toolbar stays fixed at bottom
   - Verify side columns don't scroll
5. Verify visual appearance:
   - All sections have borders
   - All sections have titles
   - Toolbar is visible and centered
   - Layout fills viewport height

### Type Checking
```bash
pnpm typecheck
```
Should pass with no errors.

---

## Dependencies
- shadcn/ui components (Textarea, Button)
- Tailwind CSS v4 (already configured)
- React Router v7 (already configured)

## Risks & Mitigations

**Risk**: Toolbar might scroll with content if positioning is incorrect
**Mitigation**: Use absolute positioning on toolbar with relative parent on center column container, not the textarea itself

**Risk**: Height calculations might not work correctly with viewport units
**Mitigation**: Use `h-screen` on main container and flex/percentage heights for subdivisions

**Risk**: shadcn/ui components might need additional configuration
**Mitigation**: Follow shadcn/ui CLI installation which handles configuration automatically

---

## Success Criteria
- [x] All shadcn/ui components installed successfully
- [x] 3-column layout renders with 1:2:1 proportions
- [x] Left column has 30:70 split (Metadata:Suggestions)
- [x] Right column has 50:50 split (Guidelines:Checklist)
- [x] Center column scrolls independently
- [x] Toolbar floats at bottom of center column (doesn't scroll)
- [x] All sections have visible borders and titles
- [x] No TypeScript errors
- [x] Layout fills full viewport height
- [x] Desktop-only (no responsive behavior needed)
