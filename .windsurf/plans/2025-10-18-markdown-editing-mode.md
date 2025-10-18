# Markdown Editing Mode Implementation Plan

## Overview

Add markdown-based editing mode to guidelines and checklist sections, replacing the current inline field editing with a full markdown textarea editor. Users can toggle between reading mode (current UI) and editing mode (markdown textarea) using an edit/confirm button.

## Current State Analysis

### Existing Implementation:

- **Guidelines**: Individual inline editing of title/description fields (`guidelines-list.tsx:172-237`)
- **Checklist**: Individual inline editing of text field (`checklist-list.tsx:113-143`)
- **Storage**: Structured JSON data in localStorage (`storage.ts` files)
- **Import/Export**: Already converts between structured data and markdown (`markdown-converter.ts`)
- **Data Flow**: React state → localStorage (JSON) → Import/Export (Markdown)

### Key Discoveries:

1. Markdown conversion functions already exist and work correctly
2. Storage layer uses validated JSON schemas with Valibot
3. Current editing is field-by-field with click-to-edit behavior
4. Import/Export uses `##` for guideline headers (keep this format)

## Desired End State

### User Experience:

1. **Reading Mode** (default):
   - Current list UI with violation badges and tooltips
   - Pencil icon button in header to enter editing mode
2. **Editing Mode**:
   - Single textarea showing all items as markdown
   - Confirm (checkmark) icon button to save and return to reading mode
   - Parse markdown optimistically, ignoring malformed content
3. **Per-Tab Editing**:
   - Guidelines tab has its own edit mode
   - Checklist tab has its own edit mode
   - Each maintains independent state

### Technical Requirements:

- **Storage Strategy**: Continue storing structured data in localStorage (Option B)
- **Conversion Flow**: Structured data ↔ Markdown only during edit mode transitions
- **Format**: Guidelines use `##` headers, checklist uses `- [ ]` items
- **Parsing**: Optimistic - ignore content that doesn't match expected patterns

## What We're NOT Doing

- Changing the data models or schemas
- Modifying the analysis logic or API calls
- Adding real-time markdown preview
- Implementing markdown syntax highlighting
- Adding undo/redo functionality
- Changing the storage layer (stays JSON in localStorage)

---

## Phase 1: Add Edit Mode State Management

### Overview

Add state to track edit mode and markdown content for both guidelines and checklist components.

### Changes Required:

#### 1. Update `app/components/guidelines/use-guidelines.ts`

**Add to interface** (line 7-17):

```typescript
interface UseGuidelinesReturn {
  guidelines: Guideline[];
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  isEditMode: boolean;
  markdownContent: string;
  addGuideline: () => void;
  updateGuideline: (id: number, updates: Partial<Guideline>) => void;
  deleteGuideline: (id: number) => void;
  analyze: (content: string) => Promise<void>;
  setGuidelines: React.Dispatch<React.SetStateAction<Guideline[]>>;
  enterEditMode: () => void;
  exitEditMode: (save: boolean) => void;
  setMarkdownContent: (content: string) => void;
}
```

**Add state variables** (after line 24):

```typescript
const [isEditMode, setIsEditMode] = React.useState(false);
const [markdownContent, setMarkdownContent] = React.useState("");
```

**Add edit mode functions** (before return statement):

```typescript
const enterEditMode = React.useCallback((): void => {
  const markdown = encodeGuidelines(guidelines);
  setMarkdownContent(markdown);
  setIsEditMode(true);
}, [guidelines]);

const exitEditMode = React.useCallback(
  (save: boolean): void => {
    if (save) {
      const parsedGuidelines = decodeGuidelines(markdownContent);
      setGuidelines(parsedGuidelines);
    }
    setIsEditMode(false);
    setMarkdownContent("");
  },
  [markdownContent],
);
```

**Add imports** (top of file):

```typescript
import { encodeGuidelines, decodeGuidelines } from "~/lib/markdown-converter";
```

**Update return statement** (line 81-91):

```typescript
return {
  guidelines,
  isAnalyzing,
  analysisResult,
  analysisError,
  isEditMode,
  markdownContent,
  addGuideline,
  updateGuideline,
  deleteGuideline,
  analyze,
  setGuidelines,
  enterEditMode,
  exitEditMode,
  setMarkdownContent,
};
```

#### 2. Update `app/components/checklist/use-checklist.ts`

**Add to interface** (line 7-17):

```typescript
interface UseChecklistReturn {
  items: ChecklistItem[];
  isAnalyzing: boolean;
  analysisResult: ChecklistAnalysisResult | null;
  analysisError: string | null;
  isEditMode: boolean;
  markdownContent: string;
  addItem: () => void;
  updateItem: (id: number, text: string) => void;
  deleteItem: (id: number) => void;
  analyze: (content: string) => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  enterEditMode: () => void;
  exitEditMode: (save: boolean) => void;
  setMarkdownContent: (content: string) => void;
}
```

**Add state variables** (after line 24):

```typescript
const [isEditMode, setIsEditMode] = React.useState(false);
const [markdownContent, setMarkdownContent] = React.useState("");
```

**Add edit mode functions** (before return statement):

```typescript
const enterEditMode = React.useCallback((): void => {
  const markdown = encodeChecklist(items);
  setMarkdownContent(markdown);
  setIsEditMode(true);
}, [items]);

const exitEditMode = React.useCallback(
  (save: boolean): void => {
    if (save) {
      const parsedItems = decodeChecklist(markdownContent);
      setItems(parsedItems);
    }
    setIsEditMode(false);
    setMarkdownContent("");
  },
  [markdownContent],
);
```

**Add imports** (top of file):

```typescript
import { encodeChecklist, decodeChecklist } from "~/lib/markdown-converter";
```

**Update return statement** (line 77-87):

```typescript
return {
  items,
  isAnalyzing,
  analysisResult,
  analysisError,
  isEditMode,
  markdownContent,
  addItem,
  updateItem,
  deleteItem,
  analyze,
  setItems,
  enterEditMode,
  exitEditMode,
  setMarkdownContent,
};
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] No build errors: `pnpm build`

#### Manual Verification:

- [x] Hooks compile without errors
- [x] New state variables are accessible in components

---

## Phase 2: Update Guidelines Component UI

### Overview

Add edit/confirm button to guidelines header and conditionally render markdown textarea or list view.

### Changes Required:

#### 1. Update `app/components/guidelines/guidelines.tsx`

**Update destructured hook values** (line 18-28):

```typescript
const {
  guidelines,
  isAnalyzing,
  analysisResult,
  analysisError,
  isEditMode,
  markdownContent,
  addGuideline,
  updateGuideline,
  deleteGuideline,
  analyze,
  setGuidelines,
  enterEditMode,
  exitEditMode,
  setMarkdownContent,
} = useGuidelines();
```

**Add icon import** (line 5):

```typescript
import {
  Plus,
  PlayCircle,
  Download,
  Upload,
  Pencil,
  Check,
} from "lucide-react";
```

**Add Textarea import** (after line 4):

```typescript
import { Textarea } from "~/components/ui/textarea";
```

**Update header buttons section** (replace lines 92-121):

```typescript
<div className="flex gap-2">
  {!isEditMode && (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleImport}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleExport}
        disabled={guidelines.length === 0}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        size="sm"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !content.trim() || guidelines.length === 0}
        className="gap-2"
      >
        <PlayCircle className="h-4 w-4" />
        Analyze
      </Button>
    </>
  )}
  <Button
    size="sm"
    variant={isEditMode ? "default" : "ghost"}
    onClick={() => isEditMode ? exitEditMode(true) : enterEditMode()}
    className="gap-2"
  >
    {isEditMode ? (
      <>
        <Check className="h-4 w-4" />
        Confirm
      </>
    ) : (
      <>
        <Pencil className="h-4 w-4" />
        Edit
      </>
    )}
  </Button>
</div>
```

**Update scrollable content section** (replace lines 140-162):

```typescript
<div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0">
  {isEditMode ? (
    <Textarea
      value={markdownContent}
      onChange={(e) => setMarkdownContent(e.target.value)}
      placeholder="Enter guidelines in markdown format:

## 1. Guideline Title

Description of the guideline...

## 2. Another Guideline

Another description..."
      className="min-h-[500px] font-mono text-sm"
    />
  ) : (
    <>
      <GuidelinesList
        guidelines={guidelines}
        violations={analysisResult?.violations || []}
        selectedGuidelineId={selectedGuidelineId}
        onSelectGuideline={setSelectedGuidelineId}
        onUpdateGuideline={updateGuideline}
        onDeleteGuideline={deleteGuideline}
      />

      {/* Add New Button */}
      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={addGuideline}
        >
          <Plus className="h-4 w-4" />
          Add Guideline
        </Button>
      </div>
    </>
  )}
</div>
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] Component compiles without errors

#### Manual Verification:

- [ ] Edit button appears in header
- [ ] Clicking Edit shows textarea with markdown
- [ ] Clicking Confirm saves and returns to list view
- [ ] Import/Export/Analyze buttons hidden in edit mode

---

## Phase 3: Update Checklist Component UI

### Overview

Add edit/confirm button to checklist header and conditionally render markdown textarea or list view.

### Changes Required:

#### 1. Update `app/components/checklist/checklist.tsx`

**Update destructured hook values** (line 18-28):

```typescript
const {
  items,
  isAnalyzing,
  analysisResult,
  analysisError,
  isEditMode,
  markdownContent,
  addItem,
  updateItem,
  deleteItem,
  analyze,
  setItems,
  enterEditMode,
  exitEditMode,
  setMarkdownContent,
} = useChecklist();
```

**Add icon import** (line 5):

```typescript
import {
  Plus,
  PlayCircle,
  Download,
  Upload,
  Pencil,
  Check,
} from "lucide-react";
```

**Add Textarea import** (after line 4):

```typescript
import { Textarea } from "~/components/ui/textarea";
```

**Update header buttons section** (replace lines 89-118):

```typescript
<div className="flex gap-2">
  {!isEditMode && (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleImport}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleExport}
        disabled={items.length === 0}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        size="sm"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !content.trim() || items.length === 0}
        className="gap-2"
      >
        <PlayCircle className="h-4 w-4" />
        Analyze
      </Button>
    </>
  )}
  <Button
    size="sm"
    variant={isEditMode ? "default" : "ghost"}
    onClick={() => isEditMode ? exitEditMode(true) : enterEditMode()}
    className="gap-2"
  >
    {isEditMode ? (
      <>
        <Check className="h-4 w-4" />
        Confirm
      </>
    ) : (
      <>
        <Pencil className="h-4 w-4" />
        Edit
      </>
    )}
  </Button>
</div>
```

**Update scrollable content section** (replace lines 138-153):

```typescript
<div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0">
  {isEditMode ? (
    <Textarea
      value={markdownContent}
      onChange={(e) => setMarkdownContent(e.target.value)}
      placeholder="Enter checklist items in markdown format:

- [ ] First checklist item
- [ ] Second checklist item
- [ ] Third checklist item"
      className="min-h-[500px] font-mono text-sm"
    />
  ) : (
    <>
      <ChecklistList
        items={items}
        results={analysisResult?.results || []}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
      />

      {/* Add New Button */}
      <div className="mt-4">
        <Button variant="outline" className="w-full gap-2" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </>
  )}
</div>
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] Component compiles without errors

#### Manual Verification:

- [ ] Edit button appears in header
- [ ] Clicking Edit shows textarea with markdown
- [ ] Clicking Confirm saves and returns to list view
- [ ] Import/Export/Analyze buttons hidden in edit mode

---

## Phase 4: Improve Markdown Parsing

### Overview

Enhance markdown parsing to be more robust and handle edge cases gracefully.

### Changes Required:

#### 1. Update `app/lib/markdown-converter.ts`

**Improve `decodeGuidelines` function** (replace lines 10-28):

```typescript
export function decodeGuidelines(markdown: string): Guideline[] {
  const guidelines: Guideline[] = [];

  // Split by ## headers, keeping the header text
  const sections = markdown.split(/^## /m).filter(Boolean);

  sections.forEach((section) => {
    const lines = section.trim().split("\n");
    if (lines.length === 0) return;

    const titleLine = lines[0];
    // Match: "1. Title" or just "Title" (auto-assign ID)
    const matchWithId = titleLine.match(/^(\d+)\.\s+(.+)$/);

    if (matchWithId) {
      const id = parseInt(matchWithId[1], 10);
      const title = matchWithId[2].trim();
      const description = lines.slice(1).join("\n").trim();

      if (title) {
        guidelines.push({ id, title, description });
      }
    } else {
      // No ID found, auto-assign
      const title = titleLine.trim();
      if (title) {
        const id =
          guidelines.length > 0
            ? Math.max(...guidelines.map((g) => g.id)) + 1
            : 1;
        const description = lines.slice(1).join("\n").trim();
        guidelines.push({ id, title, description });
      }
    }
  });

  return guidelines;
}
```

**Improve `decodeChecklist` function** (replace lines 34-46):

```typescript
export function decodeChecklist(markdown: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lines = markdown.split("\n");

  lines.forEach((line) => {
    // Match: "- [ ] text" or "- [x] text" or "- text"
    const matchCheckbox = line.match(/^-\s+\[[ xX]\]\s+(.+)$/);
    const matchSimple = line.match(/^-\s+(.+)$/);

    if (matchCheckbox) {
      const text = matchCheckbox[1].trim();
      if (text) {
        const id = items.length + 1;
        items.push({ id, text });
      }
    } else if (matchSimple) {
      const text = matchSimple[1].trim();
      if (text) {
        const id = items.length + 1;
        items.push({ id, text });
      }
    }
  });

  return items;
}
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] Build succeeds: `pnpm build`

#### Manual Verification:

- [ ] Parses guidelines without IDs (auto-assigns)
- [ ] Parses checklist items with or without checkboxes
- [ ] Ignores empty lines and malformed content
- [ ] Preserves multi-line descriptions in guidelines

---

## Phase 5: Add Keyboard Shortcuts

### Overview

Add keyboard shortcuts for better UX when editing markdown.

### Changes Required:

#### 1. Update `app/components/guidelines/guidelines.tsx`

**Add keyboard handler** (after line 73):

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
  // Cmd/Ctrl + Enter to save
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    exitEditMode(true);
  }
  // Escape to cancel
  if (e.key === "Escape") {
    e.preventDefault();
    exitEditMode(false);
  }
};
```

**Update Textarea** (in the scrollable content section):

```typescript
<Textarea
  value={markdownContent}
  onChange={(e) => setMarkdownContent(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Enter guidelines in markdown format:

## 1. Guideline Title

Description of the guideline...

## 2. Another Guideline

Another description...

Tip: Cmd/Ctrl+Enter to save, Escape to cancel"
  className="min-h-[500px] font-mono text-sm"
/>
```

#### 2. Update `app/components/checklist/checklist.tsx`

**Add keyboard handler** (after line 69):

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
  // Cmd/Ctrl + Enter to save
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    exitEditMode(true);
  }
  // Escape to cancel
  if (e.key === "Escape") {
    e.preventDefault();
    exitEditMode(false);
  }
};
```

**Update Textarea** (in the scrollable content section):

```typescript
<Textarea
  value={markdownContent}
  onChange={(e) => setMarkdownContent(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Enter checklist items in markdown format:

- [ ] First checklist item
- [ ] Second checklist item
- [ ] Third checklist item

Tip: Cmd/Ctrl+Enter to save, Escape to cancel"
  className="min-h-[500px] font-mono text-sm"
/>
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`

#### Manual Verification:

- [ ] Cmd/Ctrl+Enter saves and exits edit mode
- [ ] Escape cancels and exits edit mode without saving
- [ ] Placeholder shows keyboard shortcuts hint

---

## Testing Strategy

### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] Build succeeds: `pnpm build`
- [x] Development server starts: `pnpm dev` (running on http://localhost:5174)

### Manual Testing Steps:

#### Guidelines Tab:

1. [ ] Navigate to `http://localhost:5173`
2. [ ] Add some guidelines using the current UI
3. [ ] Click "Edit" button - should show markdown textarea
4. [ ] Verify markdown format is correct (`## ID. Title` + description)
5. [ ] Modify markdown content
6. [ ] Click "Confirm" - should parse and update list view
7. [ ] Verify changes are reflected in the list
8. [ ] Click "Edit" again - verify markdown reflects current state
9. [ ] Press Escape - should cancel without saving
10. [ ] Click "Edit", make changes, press Cmd/Ctrl+Enter - should save
11. [ ] Reload page - verify data persists
12. [ ] Test malformed markdown (missing headers, etc.) - should ignore gracefully

#### Checklist Tab:

1. [ ] Switch to Checklist tab
2. [ ] Add some checklist items using the current UI
3. [ ] Click "Edit" button - should show markdown textarea
4. [ ] Verify markdown format is correct (`- [ ] text`)
5. [ ] Modify markdown content
6. [ ] Click "Confirm" - should parse and update list view
7. [ ] Verify changes are reflected in the list
8. [ ] Click "Edit" again - verify markdown reflects current state
9. [ ] Press Escape - should cancel without saving
10. [ ] Click "Edit", make changes, press Cmd/Ctrl+Enter - should save
11. [ ] Reload page - verify data persists
12. [ ] Test malformed markdown (missing checkboxes, etc.) - should ignore gracefully

#### Integration:

1. [ ] Switch between tabs while in edit mode - each maintains independent state
2. [ ] Import markdown file - should work in reading mode
3. [ ] Export markdown file - should work in reading mode
4. [ ] Analyze button - should work in reading mode only
5. [ ] Edit mode hides Import/Export/Analyze buttons
6. [ ] Reading mode shows all buttons

#### Edge Cases:

1. [ ] Empty markdown in edit mode - should create empty list
2. [ ] Very long markdown content - textarea should scroll
3. [ ] Guidelines without IDs - should auto-assign IDs
4. [ ] Checklist items without checkboxes - should parse as items
5. [ ] Mixed valid/invalid markdown - should parse valid parts only

---

## References

- Original task: `.windsurf/tasks/2025-10-18-guidelines-checklist-markdown.md`
- Previous implementation: `.windsurf/plans/2025-10-17-guidelines-checklist-iteration.md`
- Current components: `app/components/guidelines/`, `app/components/checklist/`
- Markdown converter: `app/lib/markdown-converter.ts`
