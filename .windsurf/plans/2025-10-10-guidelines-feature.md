# Guidelines Feature Implementation Plan

## Overview
Implement the guidelines analysis feature that displays guidelines from a markdown file, analyzes blog post content against them using OpenAI, and enables interactive highlighting of non-compliant text sections.

## Current State Analysis
- Skeleton layout with empty `GuidelinesSection` component
- Guidelines content exists in `app/guidelines.md` (23 numbered items in Italian)
- Toolbar with "Analyze" button exists but has no functionality
- No data models, services, or API routes yet
- React Router v7 with file-based routing
- TypeScript strict mode enabled

### Key Discoveries:
- `app/components/guidelines-section.tsx` - Empty section ready for content
- `app/components/toolbar.tsx` - Has "Analyze" button with no handler
- `app/guidelines.md` - Markdown file with 23 numbered guidelines
- No `app/routes/api/` directory exists yet
- No state management or data models defined

## Desired End State
A fully functional guidelines analysis system where:
- Guidelines are displayed as a scrollable list parsed from markdown
- "Analyze" button triggers OpenAI API analysis via server endpoint
- Loading state shows during analysis
- Results are stored in localStorage
- Clicking a guideline highlights non-compliant text in the editor
- Clicking highlighted text highlights the corresponding guideline

### Verification:
- Run `pnpm dev` and navigate to `http://localhost:5173`
- Verify guidelines list displays all 23 items
- Click "Analyze" and verify loading state appears
- Verify OpenAI API is called and returns structured data
- Click a guideline with violations and verify text highlighting
- Refresh page and verify results persist from localStorage
- Run `pnpm typecheck` - should pass with no errors

## What We're NOT Doing
- No database integration (using localStorage for now)
- No authentication/authorization for API calls
- No real-time collaboration features
- No checklist implementation (separate feature)
- No suggestions implementation (separate feature)
- No metadata implementation (separate feature)
- No editing of guidelines (static content)
- No guideline violation editing/dismissal

## Implementation Phases

### Phase 1: Data Models and Types
**Goal**: Define TypeScript types and interfaces for the guidelines feature

**Steps**:
1. Create `app/model/guideline.ts` with types:
   - `Guideline` - Single guideline item
   - `GuidelineViolation` - Text range that violates a guideline
   - `AnalysisResult` - Complete analysis response
   - `AnalysisState` - UI state management

2. Define data structures:
```typescript
export interface Guideline {
  id: number;
  title: string;
  description: string;
}

export interface GuidelineViolation {
  guidelineId: number;
  startIndex: number;
  endIndex: number;
  reason: string;
}

export interface AnalysisResult {
  violations: GuidelineViolation[];
  analyzedAt: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  selectedGuidelineId: number | null;
}
```

**Files Created**:
- `app/model/guideline.ts`

**Verification**: Types are exported and can be imported in other files

---

### Phase 2: Parse Guidelines from Markdown
**Goal**: Create a utility to parse guidelines.md at build time

**Steps**:
1. Create `app/lib/parse-guidelines.ts`:
   - Read `guidelines.md` file
   - Parse numbered list items (format: `1. **Title**: Description`)
   - Extract id, title, and description
   - Return array of `Guideline` objects

2. Implementation approach:
   - Use regex to match pattern: `\d+\.\s+\*\*([^:]+)\*\*:\s+(.+)`
   - Handle nested lists (sub-items under main guidelines)
   - Clean up markdown formatting (links, bold, italic)

3. Create `app/data/guidelines.ts`:
   - Import and execute parser
   - Export parsed guidelines as constant
   - This runs at build time

**Files Created**:
- `app/lib/parse-guidelines.ts`
- `app/data/guidelines.ts`

**Key Implementation Details**:
```typescript
// app/lib/parse-guidelines.ts
export function parseGuidelines(markdown: string): Guideline[] {
  const lines = markdown.split('\n');
  const guidelines: Guideline[] = [];
  const regex = /^(\d+)\.\s+\*\*([^:]+)\*\*:\s+(.+)/;
  
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      guidelines.push({
        id: parseInt(match[1]),
        title: match[2].trim(),
        description: match[3].trim()
      });
    }
  }
  
  return guidelines;
}
```

**Verification**: Import guidelines in a component and log to console

---

### Phase 3: Display Guidelines List UI
**Goal**: Render guidelines as a scrollable, interactive list

**Steps**:
1. Update `app/components/guidelines-section.tsx`:
   - Import guidelines data
   - Map over guidelines array
   - Render each guideline as a list item
   - Add hover and click states
   - Make container scrollable

2. Styling requirements:
   - Scrollable container with `overflow-auto`
   - Each item has hover state
   - Selected item has highlighted background
   - Show guideline number and title prominently
   - Description in smaller, muted text

3. Add click handler (no functionality yet, just visual state):
   - Track selected guideline ID in local state
   - Apply active styles to selected item

**Files Modified**:
- `app/components/guidelines-section.tsx`

**Key Implementation Details**:
```typescript
export default function GuidelinesSection(): React.JSX.Element {
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  
  return (
    <div className="h-full flex flex-col border-l border-b border-border">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold">Guidelines</h2>
      </div>
      <div className="flex-1 overflow-auto px-4 pb-4">
        {guidelines.map((guideline) => (
          <div
            key={guideline.id}
            onClick={() => setSelectedId(guideline.id)}
            className={cn(
              "p-3 rounded-md cursor-pointer transition-colors",
              selectedId === guideline.id 
                ? "bg-accent" 
                : "hover:bg-accent/50"
            )}
          >
            <div className="font-medium text-sm">
              {guideline.id}. {guideline.title}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {guideline.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Verification**: Guidelines list displays all 23 items with proper styling

---

### Phase 4: Create API Route for Analysis
**Goal**: Set up server-side API endpoint to call OpenAI

**Steps**:
1. Create `app/routes/api/` directory structure

2. Create `app/routes/api/analyze.ts`:
   - Export `action` function (POST handler in React Router v7)
   - Accept blog post text and guidelines in request body
   - Call OpenAI API with structured output
   - Return `AnalysisResult` as JSON

3. OpenAI integration:
   - Use `openai` npm package
   - Configure API key from environment variable
   - Use GPT-4 with structured output mode
   - Prompt engineering to identify violations with text ranges

4. Update `app/routes.ts` to register API route

5. Create `.env.example` file with required variables

**Files Created**:
- `app/routes/api/analyze.ts`
- `.env.example`

**Files Modified**:
- `app/routes.ts`
- `package.json` (add openai dependency)

**Key Implementation Details**:
```typescript
// app/routes/api/analyze.ts
import { type ActionFunctionArgs } from "react-router";
import OpenAI from "openai";

export async function action({ request }: ActionFunctionArgs) {
  const { text, guidelines } = await request.json();
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a blog post reviewer. Analyze the text against guidelines and identify violations with exact character positions."
      },
      {
        role: "user",
        content: `Guidelines:\n${JSON.stringify(guidelines)}\n\nText to analyze:\n${text}`
      }
    ],
    response_format: { type: "json_object" }
  });
  
  const result = JSON.parse(completion.choices[0].message.content);
  
  return Response.json({
    violations: result.violations,
    analyzedAt: new Date().toISOString()
  });
}
```

**Environment Variables**:
```
OPENAI_API_KEY=sk-...
```

**Verification**: 
- API route responds to POST requests
- OpenAI API is called successfully
- Structured data is returned

---

### Phase 5: Implement Analysis Service
**Goal**: Create client-side service to call API and manage state

**Steps**:
1. Create `app/service/analysis-service.ts`:
   - Function to call `/api/analyze` endpoint
   - Handle loading, success, and error states
   - Save results to localStorage
   - Load results from localStorage on init

2. localStorage key structure:
   - Key: `blog-analysis-${textHash}` (hash of analyzed text)
   - Value: JSON stringified `AnalysisResult`

3. Create helper functions:
   - `analyzeText(text: string): Promise<AnalysisResult>`
   - `saveAnalysis(text: string, result: AnalysisResult): void`
   - `loadAnalysis(text: string): AnalysisResult | null`
   - `clearAnalysis(): void`

**Files Created**:
- `app/service/analysis-service.ts`

**Key Implementation Details**:
```typescript
export async function analyzeText(text: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, guidelines })
  });
  
  if (!response.ok) {
    throw new Error('Analysis failed');
  }
  
  const result = await response.json();
  saveAnalysis(text, result);
  return result;
}

function saveAnalysis(text: string, result: AnalysisResult): void {
  const hash = simpleHash(text);
  localStorage.setItem(`blog-analysis-${hash}`, JSON.stringify(result));
}
```

**Verification**: Service functions work correctly and persist to localStorage

---

### Phase 6: Connect Toolbar to Analysis
**Goal**: Wire up "Analyze" button to trigger analysis

**Steps**:
1. Update `app/routes/home.tsx`:
   - Add state management for analysis
   - Pass state and handlers to child components
   - Manage shared state between Toolbar, Guidelines, and TextEditor

2. Create analysis state hook:
   - Use `useState` for `AnalysisState`
   - Handle analyze button click
   - Update loading state during API call
   - Store result in state and localStorage

3. Update `app/components/toolbar.tsx`:
   - Accept `onAnalyze` callback prop
   - Accept `isAnalyzing` prop for loading state
   - Disable button during analysis
   - Show loading indicator

4. Update `app/components/text-editor-section.tsx`:
   - Accept `text` and `onTextChange` props
   - Make textarea controlled component

**Files Modified**:
- `app/routes/home.tsx`
- `app/components/toolbar.tsx`
- `app/components/text-editor-section.tsx`

**Key Implementation Details**:
```typescript
// app/routes/home.tsx
export default function Home(): React.JSX.Element {
  const [text, setText] = React.useState('');
  const [analysisState, setAnalysisState] = React.useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
    selectedGuidelineId: null
  });
  
  const handleAnalyze = async () => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const result = await analyzeText(text);
      setAnalysisState(prev => ({ ...prev, result, isAnalyzing: false }));
    } catch (error) {
      setAnalysisState(prev => ({ 
        ...prev, 
        error: error.message, 
        isAnalyzing: false 
      }));
    }
  };
  
  return (
    <div className="grid grid-cols-4 h-screen">
      {/* ... */}
      <Toolbar 
        onAnalyze={handleAnalyze} 
        isAnalyzing={analysisState.isAnalyzing} 
      />
      {/* ... */}
    </div>
  );
}
```

**Verification**: 
- Clicking "Analyze" triggers API call
- Loading state displays correctly
- Results are stored in state

---

### Phase 7: Add Loading State to Guidelines Section
**Goal**: Show loading indicator over guidelines during analysis

**Steps**:
1. Update `app/components/guidelines-section.tsx`:
   - Accept `isAnalyzing` prop
   - Show loading overlay when analyzing
   - Use semi-transparent overlay with spinner

2. Add loading component:
   - Can use shadcn/ui spinner or simple CSS animation
   - Center in the guidelines section
   - Overlay entire section

**Files Modified**:
- `app/components/guidelines-section.tsx`

**Key Implementation Details**:
```typescript
export default function GuidelinesSection({ 
  isAnalyzing 
}: { 
  isAnalyzing: boolean 
}): React.JSX.Element {
  return (
    <div className="h-full flex flex-col border-l border-b border-border relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Analyzing...</div>
        </div>
      )}
      {/* ... rest of component */}
    </div>
  );
}
```

**Verification**: Loading overlay appears during analysis

---

### Phase 8: Implement Text Highlighting
**Goal**: Highlight text in editor when guideline is clicked

**Steps**:
1. Update `app/components/text-editor-section.tsx`:
   - Accept `violations` and `selectedGuidelineId` props
   - Render text with highlighted spans for violations
   - Use `contenteditable` div instead of textarea for rich formatting
   - Or use textarea with overlay for highlights

2. Highlighting approach (using overlay):
   - Keep textarea for input
   - Add absolutely positioned div behind it
   - Render highlighted text in overlay
   - Make textarea transparent background

3. Calculate which violations to highlight:
   - Filter violations by `selectedGuidelineId`
   - Apply highlight styles to text ranges

4. Styling:
   - Highlighted text: yellow background or red underline
   - Smooth transitions
   - Maintain scroll sync between textarea and overlay

**Files Modified**:
- `app/components/text-editor-section.tsx`

**Key Implementation Details**:
```typescript
export default function TextEditorSection({
  text,
  onTextChange,
  violations,
  selectedGuidelineId
}: {
  text: string;
  onTextChange: (text: string) => void;
  violations: GuidelineViolation[];
  selectedGuidelineId: number | null;
}): React.JSX.Element {
  const highlightedViolations = violations.filter(
    v => v.guidelineId === selectedGuidelineId
  );
  
  const renderHighlightedText = () => {
    if (!selectedGuidelineId || highlightedViolations.length === 0) {
      return text;
    }
    
    // Sort violations by startIndex
    const sorted = [...highlightedViolations].sort((a, b) => a.startIndex - b.startIndex);
    
    let result = '';
    let lastIndex = 0;
    
    for (const violation of sorted) {
      result += text.slice(lastIndex, violation.startIndex);
      result += `<mark class="bg-yellow-200">${text.slice(violation.startIndex, violation.endIndex)}</mark>`;
      lastIndex = violation.endIndex;
    }
    result += text.slice(lastIndex);
    
    return result;
  };
  
  return (
    <div className="h-full flex flex-col relative">
      {/* Highlight overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
      />
      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="relative z-10 bg-transparent"
      />
    </div>
  );
}
```

**Verification**: 
- Clicking guideline highlights corresponding text
- Multiple violations can be highlighted
- Highlighting updates when selection changes

---

### Phase 9: Show Violation Count per Guideline
**Goal**: Display number of violations next to each guideline

**Steps**:
1. Update `app/components/guidelines-section.tsx`:
   - Accept `violations` prop
   - Calculate violation count per guideline
   - Display count badge next to guideline title
   - Style badge with color (red for violations, green for none)

2. Badge styling:
   - Small circular badge with count
   - Position at the right side of guideline item
   - Red background if violations > 0
   - Gray or hidden if no violations

**Files Modified**:
- `app/components/guidelines-section.tsx`

**Key Implementation Details**:
```typescript
const violationCounts = React.useMemo(() => {
  const counts: Record<number, number> = {};
  violations.forEach(v => {
    counts[v.guidelineId] = (counts[v.guidelineId] || 0) + 1;
  });
  return counts;
}, [violations]);

// In render:
<div className="flex items-center justify-between">
  <span>{guideline.title}</span>
  {violationCounts[guideline.id] > 0 && (
    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
      {violationCounts[guideline.id]}
    </span>
  )}
</div>
```

**Verification**: Violation counts display correctly for each guideline

---

### Phase 10: Load Cached Results on Mount
**Goal**: Restore analysis results from localStorage when page loads

**Steps**:
1. Update `app/routes/home.tsx`:
   - Add `useEffect` to load cached results on mount
   - Check localStorage for analysis matching current text
   - Restore analysis state if found

2. Handle text changes:
   - Clear cached results if text changes significantly
   - Or show indicator that results are stale

**Files Modified**:
- `app/routes/home.tsx`

**Key Implementation Details**:
```typescript
React.useEffect(() => {
  if (text) {
    const cached = loadAnalysis(text);
    if (cached) {
      setAnalysisState(prev => ({ ...prev, result: cached }));
    }
  }
}, [text]);
```

**Verification**: 
- Refresh page and verify results persist
- Change text and verify results clear

---

## Testing Strategy

### Manual Testing
1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:5173`
3. Verify guidelines list:
   - All 23 guidelines display
   - Scrolling works
   - Hover states work
4. Test analysis flow:
   - Enter text in editor
   - Click "Analyze" button
   - Verify loading state appears
   - Verify analysis completes
   - Check browser console for API response
5. Test highlighting:
   - Click guideline with violations
   - Verify text highlights in editor
   - Click different guideline
   - Verify highlighting updates
6. Test persistence:
   - Analyze text
   - Refresh page
   - Verify results persist
7. Test error handling:
   - Disconnect network
   - Try to analyze
   - Verify error message displays

### Type Checking
```bash
pnpm typecheck
```
Should pass with no errors.

### Environment Setup
1. Copy `.env.example` to `.env`
2. Add OpenAI API key
3. Verify API calls work

---

## Dependencies
- `openai` - OpenAI API client (add to package.json)
- Existing: React Router v7, TypeScript, Tailwind CSS

## Risks & Mitigations

**Risk**: OpenAI API calls might be slow or fail
**Mitigation**: 
- Show clear loading state
- Implement error handling with retry logic
- Consider timeout after 30 seconds

**Risk**: Text highlighting with textarea is complex
**Mitigation**: 
- Use overlay approach with synchronized scrolling
- Or switch to contenteditable div for richer control
- Test with long documents

**Risk**: localStorage has size limits
**Mitigation**: 
- Store only essential data (violations, not full text)
- Implement cleanup for old entries
- Show warning if storage is full

**Risk**: Character indices might be off due to line endings or unicode
**Mitigation**: 
- Normalize text before sending to API
- Use consistent line ending format
- Test with special characters

**Risk**: OpenAI structured output might not match expected format
**Mitigation**: 
- Validate response structure
- Provide clear schema in prompt
- Handle parsing errors gracefully

---

## Success Criteria
- [x] Guidelines list displays all 23 items from markdown file
- [x] Guidelines section is scrollable
- [x] "Analyze" button triggers API call
- [x] Loading state displays during analysis
- [x] OpenAI API returns structured violation data
- [x] Violation counts display next to guidelines
- [x] Clicking guideline highlights text in editor
- [x] Highlighted text matches violation ranges
- [x] Analysis results persist in localStorage
- [x] Results restore on page refresh
- [x] No TypeScript errors
- [x] Error handling works for API failures
- [x] Text changes clear stale results

---

## Future Enhancements (Out of Scope)
- Edit/dismiss individual violations
- Export analysis report
- Compare multiple analyses
- Real-time analysis as user types
- Guideline suggestions/recommendations
- Custom guideline creation
- Multi-language support
- Collaborative review features
