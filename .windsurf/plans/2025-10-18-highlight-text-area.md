# Text Highlighting for Guideline Violations Implementation Plan

## Overview

Implement a text highlighting feature that visually indicates which parts of the blog post content violate a selected guideline. When a user clicks on a failing guideline, the corresponding text excerpts (from `textVerbatim`) will be highlighted in the central textarea using a layered div approach.

## Current State Analysis

**What exists:**

- `TextEditorSection` component with a basic `<textarea>` for content editing (app/components/text-editor-section.tsx)
- `Guidelines` component that analyzes content and tracks violations (app/components/guidelines/guidelines.tsx)
- `GuidelineViolation` model with optional `textVerbatim: string[]` field (app/model/guideline.ts:12)
- `onAnalysisComplete` callback prop exists but is not wired up in home.tsx
- `selectedGuidelineId` state exists in GuidelinesList but isn't communicated to parent

**What's missing:**

- Data flow from Guidelines component to home.tsx to TextEditorSection
- Highlight rendering layer behind the textarea
- Text position calculation logic to place highlights correctly
- Scroll synchronization between textarea and highlight layer

**Key Constraints:**

- Must use exact string matching (no fuzzy matching)
- Highlights disappear when text is edited and no longer matches
- Multiple text parts can fail the same guideline
- Must maintain visual sync during scrolling and editing

## Desired End State

When a user clicks on a failing guideline:

1. The guideline becomes selected (existing behavior)
2. All text excerpts in `textVerbatim` are highlighted with amber/yellow background
3. Highlights scroll with the textarea content
4. Clicking the same guideline again deselects it and removes highlights
5. Editing text that breaks exact matches removes those specific highlights

### Verification:

- User can click a guideline with violations and see highlighted text
- Multiple text excerpts are all highlighted simultaneously
- Scrolling the textarea keeps highlights aligned
- Typing in the textarea maintains highlight alignment
- Deselecting a guideline removes all highlights

## What We're NOT Doing

- Fuzzy matching or partial text matching
- Different colors for different guidelines
- Click-to-navigate from highlight to text
- Highlight animations or transitions
- Mobile/touch optimization
- Accessibility enhancements (ARIA labels, screen reader support)

## Implementation Approach

Use the layered div technique from the CodePen example:

1. Position a div behind the textarea with identical dimensions and styling
2. Calculate text positions by finding character offsets of `textVerbatim` strings
3. Render highlight spans with absolute positioning or inline layout
4. Synchronize scroll position between textarea and highlight layer
5. Recalculate highlights on content changes

## Phase 1: Data Flow Setup

### Overview

Establish the data flow from Guidelines component → home.tsx → TextEditorSection so that violations and selected guideline ID are available where needed.

### Changes Required:

#### 1. Home Component State Management

**File**: `app/routes/home.tsx`

**Changes**: Add state for analysis result and selected guideline, wire up Guidelines callback

```tsx
export default function Home(): React.JSX.Element {
  const [pageContent, setPageContent] = React.useState<string>("");
  const [analysisResult, setAnalysisResult] =
    React.useState<AnalysisResult | null>(null);
  const [selectedGuidelineId, setSelectedGuidelineId] = React.useState<
    number | null
  >(null);

  // ... existing useEffects ...

  const handleAnalysisComplete = React.useCallback(
    (result: AnalysisResult): void => {
      setAnalysisResult(result);
    },
    [],
  );

  return (
    <div className="grid grid-cols-9 h-screen">
      {/* ... left column ... */}

      <div className="col-span-4 relative h-screen">
        <TextEditorSection
          content={pageContent}
          onContentChange={setPageContent}
          violations={analysisResult?.violations || []}
          selectedGuidelineId={selectedGuidelineId}
          isLoading={false}
        />
      </div>

      {/* ... right column ... */}
      <Guidelines
        content={pageContent}
        onAnalysisComplete={handleAnalysisComplete}
        onSelectedGuidelineChange={setSelectedGuidelineId}
      />
    </div>
  );
}
```

**Import additions**:

```tsx
import type { AnalysisResult } from "~/model/guideline";
```

#### 2. Guidelines Component - Expose Selected Guideline

**File**: `app/components/guidelines/guidelines.tsx`

**Changes**: Add `onSelectedGuidelineChange` prop and pass it to GuidelinesList

```tsx
interface GuidelinesProps {
  content: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onSelectedGuidelineChange?: (id: number | null) => void;
}

export default function Guidelines({
  content,
  onAnalysisComplete,
  onSelectedGuidelineChange,
}: GuidelinesProps): React.JSX.Element {
  // ... existing code ...

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* ... header and error sections ... */}

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0">
        {isEditMode ? (
          <Textarea /* ... */ />
        ) : (
          <GuidelinesList
            guidelines={guidelines}
            violations={analysisResult?.violations || []}
            selectedGuidelineId={selectedGuidelineId}
            onSelectGuideline={(id) => {
              setSelectedGuidelineId(id);
              onSelectedGuidelineChange?.(id);
            }}
            onUpdateGuideline={updateGuideline}
          />
        )}
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`

#### Manual Verification:

- [ ] Console.log in home.tsx shows analysisResult updates after clicking "Analyze"
- [ ] Console.log in home.tsx shows selectedGuidelineId updates when clicking guidelines
- [ ] No runtime errors in browser console

---

## Phase 2: Highlight Layer Component

### Overview

Create a new component that renders highlight boxes behind the textarea, calculating positions based on text content and violation data.

### Changes Required:

#### 1. Create TextHighlightLayer Component

**File**: `app/components/text-highlight-layer.tsx` (new file)

**Purpose**: Render colored highlight boxes for matching text excerpts

```tsx
import * as React from "react";

interface TextHighlight {
  text: string;
  startIndex: number;
  endIndex: number;
}

interface TextHighlightLayerProps {
  content: string;
  highlights: string[];
  className?: string;
}

export default function TextHighlightLayer({
  content,
  highlights,
  className = "",
}: TextHighlightLayerProps): React.JSX.Element {
  const highlightPositions = React.useMemo((): TextHighlight[] => {
    const positions: TextHighlight[] = [];

    highlights.forEach((highlightText) => {
      let searchIndex = 0;
      while (searchIndex < content.length) {
        const index = content.indexOf(highlightText, searchIndex);
        if (index === -1) break;

        positions.push({
          text: highlightText,
          startIndex: index,
          endIndex: index + highlightText.length,
        });

        searchIndex = index + highlightText.length;
      }
    });

    return positions;
  }, [content, highlights]);

  // Split content into parts: before highlight, highlight, after highlight
  const renderContent = (): React.ReactNode => {
    if (highlightPositions.length === 0) {
      return content;
    }

    // Sort positions by start index
    const sortedPositions = [...highlightPositions].sort(
      (a, b) => a.startIndex - b.startIndex,
    );

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedPositions.forEach((pos, idx) => {
      // Add text before highlight
      if (pos.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.substring(lastIndex, pos.startIndex)}
          </span>,
        );
      }

      // Add highlighted text
      parts.push(
        <mark
          key={`highlight-${idx}`}
          className="bg-amber-200/60 text-transparent"
        >
          {content.substring(pos.startIndex, pos.endIndex)}
        </mark>,
      );

      lastIndex = pos.endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className={className} aria-hidden="true">
      {renderContent()}
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] Component file exists at correct path

#### Manual Verification:

- [ ] Component renders without errors when imported
- [ ] Highlight positions are calculated correctly for sample text

---

## Phase 3: Integrate Highlight Layer with TextEditorSection

### Overview

Modify TextEditorSection to layer the highlight component behind the textarea with synchronized styling and scrolling.

### Changes Required:

#### 1. Update TextEditorSection Component

**File**: `app/components/text-editor-section.tsx`

**Changes**: Add highlight layer, synchronize scroll, match styling

```tsx
import * as React from "react";
import type { GuidelineViolation } from "~/model/guideline";
import TextHighlightLayer from "./text-highlight-layer";

interface TextEditorSectionProps {
  content: string;
  onContentChange: (content: string) => void;
  violations: GuidelineViolation[];
  selectedGuidelineId: number | null;
  isLoading: boolean;
}

export default function TextEditorSection({
  content,
  onContentChange,
  violations,
  selectedGuidelineId,
  isLoading,
}: TextEditorSectionProps): React.JSX.Element {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const highlightRef = React.useRef<HTMLDivElement>(null);

  // Get text excerpts to highlight based on selected guideline
  const highlightTexts = React.useMemo((): string[] => {
    if (selectedGuidelineId === null) return [];

    const selectedViolations = violations.filter(
      (v) => v.guidelineId === selectedGuidelineId,
    );

    const texts: string[] = [];
    selectedViolations.forEach((violation) => {
      if (violation.textVerbatim) {
        texts.push(...violation.textVerbatim);
      }
    });

    return texts;
  }, [violations, selectedGuidelineId]);

  // Synchronize scroll position
  const handleScroll = React.useCallback((): void => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      {/* Highlight layer - positioned behind textarea */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <TextHighlightLayer
          content={content}
          highlights={highlightTexts}
          ref={highlightRef}
          className="w-full h-full px-10 py-2 border border-transparent rounded-md overflow-auto whitespace-pre-wrap break-words font-mono text-base leading-normal"
        />
      </div>

      {/* Textarea - positioned in front */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onScroll={handleScroll}
        placeholder="Paste or type your blog post content here..."
        className="w-full h-full px-10 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-transparent relative z-10 font-mono text-base leading-normal"
      />
    </div>
  );
}
```

#### 2. Update TextHighlightLayer to Support Ref

**File**: `app/components/text-highlight-layer.tsx`

**Changes**: Use forwardRef to expose div element

```tsx
import * as React from "react";

interface TextHighlight {
  text: string;
  startIndex: number;
  endIndex: number;
}

interface TextHighlightLayerProps {
  content: string;
  highlights: string[];
  className?: string;
}

const TextHighlightLayer = React.forwardRef<
  HTMLDivElement,
  TextHighlightLayerProps
>(function TextHighlightLayer(
  { content, highlights, className = "" },
  ref,
): React.JSX.Element {
  // ... existing logic ...

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {renderContent()}
    </div>
  );
});

export default TextHighlightLayer;
```

### Success Criteria:

#### Automated Verification:

- [x] Type checking passes: `pnpm typecheck`
- [x] Build succeeds: `pnpm build`
- [x] Dev server runs without errors: `pnpm dev`

#### Manual Verification:

- [ ] Clicking a guideline with violations shows amber highlights in textarea
- [ ] Scrolling textarea keeps highlights aligned
- [ ] Typing in textarea maintains highlight positions
- [ ] Deselecting guideline removes highlights
- [ ] Multiple text excerpts are all highlighted
- [ ] Editing text so it no longer matches removes that highlight

---

## Testing Strategy

### Unit Tests:

Not implementing unit tests in this phase - focus on manual verification first.

### Manual Testing Steps:

1. **Setup Test Data**:
   - Add guidelines via the Guidelines panel
   - Paste blog post content with text that violates guidelines
   - Click "Analyze" to get violations

2. **Test Basic Highlighting**:
   - Click on a guideline with violations
   - Verify amber highlights appear on matching text
   - Click the same guideline again to deselect
   - Verify highlights disappear

3. **Test Multiple Excerpts**:
   - Find a guideline with multiple `textVerbatim` entries
   - Click the guideline
   - Verify all excerpts are highlighted

4. **Test Scroll Synchronization**:
   - Add enough content to make textarea scrollable
   - Click a guideline to show highlights
   - Scroll the textarea up and down
   - Verify highlights stay aligned with text

5. **Test Edit Behavior**:
   - Click a guideline to show highlights
   - Edit the highlighted text
   - Verify highlight disappears when text no longer matches exactly
   - Verify other highlights remain if they still match

6. **Test Edge Cases**:
   - Empty content
   - No violations
   - Guideline with no textVerbatim
   - Very long text excerpts
   - Overlapping text excerpts

## References

- Original task: `.windsurf/plans/2025-10-18-highlight-text-area`
- CodePen example: https://codepen.io/lonekorean/pen/gaLEMR
- Current implementation: `app/components/text-editor-section.tsx`
