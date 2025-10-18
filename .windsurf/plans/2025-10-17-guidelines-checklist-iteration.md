# Guidelines and Checklist Iteration Implementation Plan

## Overview

Transform guidelines/checklist into editable, full-page tabbed interface with localStorage persistence, independent analysis buttons, and Markdown import/export.

## Current State

- 3-column grid, Guidelines/Checklist stacked 50/50 in right column (`home.tsx:116-135`)
- Single floating toolbar triggers both analyses (`home.tsx:106-112`)
- Empty state arrays, no localStorage for items themselves
- Read-only display components

## Desired End State

- Right column = full-page tabs (Guidelines | Checklist)
- Inline editing: press Enter to add/move to next item
- Auto-save to localStorage
- 2-3 line ellipsis for long text when not editing
- Independent "Analyze" button per tab
- Markdown import/export

## What We're NOT Doing

- Undo/redo (deferred)
- Confirmation dialogs
- Server persistence

---

## Phase 1: Refactor Service Layer

### Overview

Rename analysis service and prepare utilities that will be used by feature modules.

### Rename `app/service/analysis-service.ts` to `app/service/analysis.ts`

Update all imports across the codebase:

- `app/routes/home.tsx`
- Any other files importing from `analysis-service`

### Add utility functions to `app/lib/utils.ts`:

```typescript
export function truncateToLines(text: string, maxLines: number): string {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join("\n") + "...";
}

export function getNextId<T extends { id: number }>(items: T[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}
```

**Success**: Service renamed, utility functions available.

---

## Phase 2: Tabs UI

### Install tabs:

```bash
pnpm dlx shadcn@latest add tabs
```

### Refactor `home.tsx` right column (lines 115-135):

```typescript
<Tabs defaultValue="guidelines" className="flex flex-col h-full">
  <div className="shrink-0 border-b border-l border-border px-4">
    <TabsList className="h-12 w-full justify-start">
      <TabsTrigger value="guidelines" className="flex-1">Guidelines</TabsTrigger>
      <TabsTrigger value="checklist" className="flex-1">Checklist</TabsTrigger>
    </TabsList>
  </div>

  <TabsContent value="guidelines" className="flex-1 mt-0 min-h-0">
    <GuidelinesSection {...guidelinesProps} />
  </TabsContent>

  <TabsContent value="checklist" className="flex-1 mt-0 min-h-0">
    <ChecklistSection {...checklistProps} />
  </TabsContent>
</Tabs>
```

### Remove borders from section components.

### Delete `Toolbar` component and its import/usage.

**Success**: Tabs render, can switch between them, no floating toolbar.

---

## Phase 3: Guidelines Feature Module

### Overview

Transform guidelines into a self-contained feature with its own state management, persistence, and analysis logic.

### Create feature structure:

```
app/components/guidelines/
├── guidelines.tsx               # Main container component
├── guidelines-list.tsx          # Display/edit component
└── storage.ts                   # localStorage utilities
```

### 1. Create `app/components/guidelines/storage.ts`:

```typescript
import * as v from "valibot";
import { GuidelineSchema, type Guideline } from "~/model/guideline";

const STORAGE_KEY = "scribo-guidelines";

export function saveGuidelines(guidelines: Guideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guidelines));
  } catch (error) {
    console.error("Failed to save guidelines:", error);
  }
}

export function loadGuidelines(): Guideline[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const result = v.safeParse(v.array(GuidelineSchema), JSON.parse(stored));
      if (result.success) return result.output;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to load guidelines:", error);
  }
  return [];
}
```

### 2. Create `app/components/guidelines/use-guidelines.ts`:

```typescript
import * as React from "react";
import type { Guideline, AnalysisResult } from "~/model/guideline";
import { analyzeText } from "~/service/analysis";
import { saveGuidelines, loadGuidelines } from "./storage";
import { getNextId } from "~/lib/utils";

interface UseGuidelinesReturn {
  guidelines: Guideline[];
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  addGuideline: () => void;
  updateGuideline: (id: number, updates: Partial<Guideline>) => void;
  deleteGuideline: (id: number) => void;
  analyze: (content: string) => Promise<void>;
}

export function useGuidelines(): UseGuidelinesReturn {
  const [guidelines, setGuidelines] = React.useState<Guideline[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    setGuidelines(loadGuidelines());
  }, []);

  // Save to localStorage whenever guidelines change
  React.useEffect(() => {
    if (guidelines.length >= 0) {
      saveGuidelines(guidelines);
    }
  }, [guidelines]);

  const addGuideline = React.useCallback((): void => {
    const newGuideline: Guideline = {
      id: getNextId(guidelines),
      title: "",
      description: "",
    };
    setGuidelines((prev) => [...prev, newGuideline]);
  }, [guidelines]);

  const updateGuideline = React.useCallback(
    (id: number, updates: Partial<Guideline>): void => {
      setGuidelines((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      );
    },
    [],
  );

  const deleteGuideline = React.useCallback((id: number): void => {
    setGuidelines((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const analyze = React.useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || guidelines.length === 0) return;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeText(content, guidelines);
        setAnalysisResult(result);
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "Analysis failed",
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [guidelines],
  );

  return {
    guidelines,
    isAnalyzing,
    analysisResult,
    analysisError,
    addGuideline,
    updateGuideline,
    deleteGuideline,
    analyze,
  };
}
```

### 3. Create `app/components/guidelines/guidelines-list.tsx`:

Display component with inline editing:

- Click to edit title/description
- Enter on title → move to description
- Shift+Enter on description → save
- Delete button on hover
- Truncate description to 3 lines when not editing
- Show violation badges and tooltips

### 4. Create `app/components/guidelines/guidelines.tsx`:

Main container that:

- Uses `useGuidelines()` hook
- Renders header with "Analyze" button
- Renders `GuidelinesList` component
- Renders "Add Guideline" button
- Accepts props: `content: string`, `onAnalysisComplete?: (result: AnalysisResult) => void`

### 5. Update `home.tsx`:

Replace `GuidelinesSection` with new `Guidelines` component:

```typescript
import Guidelines from "~/components/guidelines";

// In TabsContent:
<Guidelines
  content={pageContent}
  onAnalysisComplete={(result) => {
    // Optional: handle analysis completion in parent
  }}
/>
```

**Success**: Guidelines feature is self-contained, manages its own state/persistence/analysis.

---

## Phase 4: Checklist Feature Module

### Overview

Transform checklist into a self-contained feature following the same pattern as guidelines.

### Create feature structure:

```
app/components/checklist/
├── checklist.tsx                # Main container component
├── checklist-list.tsx           # Display/edit component
└── storage.ts                   # localStorage utilities
```

### 1. Create `app/components/checklist/storage.ts`:

```typescript
import * as v from "valibot";
import { ChecklistItemSchema, type ChecklistItem } from "~/model/checklist";

const STORAGE_KEY = "scribo-checklist";

export function saveChecklistItems(items: ChecklistItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save checklist:", error);
  }
}

export function loadChecklistItems(): ChecklistItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const result = v.safeParse(
        v.array(ChecklistItemSchema),
        JSON.parse(stored),
      );
      if (result.success) return result.output;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to load checklist:", error);
  }
  return [];
}
```

### 2. Create `app/components/checklist/use-checklist.ts`:

```typescript
import * as React from "react";
import type { ChecklistItem, ChecklistAnalysisResult } from "~/model/checklist";
import { analyzeChecklist } from "~/service/analysis";
import { saveChecklistItems, loadChecklistItems } from "./checklist-storage";
import { getNextId } from "~/lib/utils";

interface UseChecklistReturn {
  items: ChecklistItem[];
  isAnalyzing: boolean;
  analysisResult: ChecklistAnalysisResult | null;
  analysisError: string | null;
  addItem: () => void;
  updateItem: (id: number, text: string) => void;
  deleteItem: (id: number) => void;
  analyze: (content: string) => Promise<void>;
}

export function useChecklist(): UseChecklistReturn {
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<ChecklistAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    setItems(loadChecklistItems());
  }, []);

  // Save to localStorage whenever items change
  React.useEffect(() => {
    if (items.length >= 0) {
      saveChecklistItems(items);
    }
  }, [items]);

  const addItem = React.useCallback((): void => {
    const newItem: ChecklistItem = {
      id: getNextId(items),
      text: "",
    };
    setItems((prev) => [...prev, newItem]);
  }, [items]);

  const updateItem = React.useCallback((id: number, text: string): void => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }, []);

  const deleteItem = React.useCallback((id: number): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const analyze = React.useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || items.length === 0) return;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeChecklist(content, items);
        setAnalysisResult(result);
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "Analysis failed",
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [items],
  );

  return {
    items,
    isAnalyzing,
    analysisResult,
    analysisError,
    addItem,
    updateItem,
    deleteItem,
    analyze,
  };
}
```

### 3. Create `app/components/checklist/checklist-list.tsx`:

Display component with inline editing:

- Click to edit text
- Enter → save and add new item
- Delete button on hover
- Truncate to 3 lines when not editing
- Show check/uncheck status with tooltips

### 4. Create `app/components/checklist/checklist.tsx`:

Main container that:

- Uses `useChecklist()` hook
- Renders header with "Analyze" button
- Renders `ChecklistList` component
- Renders "Add Item" button
- Accepts props: `content: string`, `onAnalysisComplete?: (result: ChecklistAnalysisResult) => void`

### 5. Update `home.tsx`:

Replace `ChecklistSection` with new `Checklist` component:

```typescript
import Checklist from "~/components/checklist";

// In TabsContent:
<Checklist
  content={pageContent}
  onAnalysisComplete={(result) => {
    // Optional: handle analysis completion in parent
  }}
/>
```

**Success**: Checklist feature is self-contained, manages its own state/persistence/analysis.

---

## Phase 5: Import/Export

### Create `app/lib/markdown-converter.ts`:

```typescript
import type { Guideline } from "~/model/guideline";
import type { ChecklistItem } from "~/model/checklist";

export function encodeGuidelines(guidelines: Guideline[]): string {
  return guidelines
    .map((g) => `## ${g.id}. ${g.title}\n\n${g.description}\n`)
    .join("\n");
}

export function decodeGuidelines(markdown: string): Guideline[] {
  const guidelines: Guideline[] = [];
  const sections = markdown.split(/^## /m).filter(Boolean);

  sections.forEach((section) => {
    const lines = section.trim().split("\n");
    const titleLine = lines[0];
    const match = titleLine.match(/^(\d+)\.\s+(.+)$/);

    if (match) {
      const id = parseInt(match[1], 10);
      const title = match[2].trim();
      const description = lines.slice(1).join("\n").trim();
      guidelines.push({ id, title, description });
    }
  });

  return guidelines;
}

export function encodeChecklist(items: ChecklistItem[]): string {
  return items.map((item) => `- [ ] ${item.text}`).join("\n");
}

export function decodeChecklist(markdown: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lines = markdown.split("\n").filter(Boolean);

  lines.forEach((line, index) => {
    const match = line.match(/^-\s+\[[ x]\]\s+(.+)$/);
    if (match) {
      items.push({ id: index + 1, text: match[1].trim() });
    }
  });

  return items;
}
```

### Add import/export buttons to both sections:

- "Import" button opens file picker, reads as text, converts from Markdown
- "Export" button downloads Markdown file

### Add shadcn button with download icon for export.

**Success**: Export creates valid Markdown, import parses and loads correctly.

---

## Testing Strategy

### Automated:

- `pnpm typecheck` - no type errors
- `pnpm build` - successful build

### Manual:

1. Add guidelines/checklist items inline
2. Edit existing items
3. Delete items
4. Reload page - data persists
5. Switch tabs - no data loss
6. Click Analyze per section - only that section analyzes
7. Export to Markdown - valid format
8. Import from Markdown - data loads correctly
9. Long text shows ellipsis when not editing

---

## References

- Task: `.windsurf/tasks/2025-10-17-guidelines-checklist.md`
- Current implementation: `app/routes/home.tsx`, `app/components/guidelines-section.tsx`, `app/components/checklist-section.tsx`
