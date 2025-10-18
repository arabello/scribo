import * as React from "react";
import { useGuidelines } from "./use-guidelines";
import GuidelinesList from "./guidelines-list";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { PlayCircle, Download, Upload, Pencil, Check } from "lucide-react";
import type { AnalysisResult } from "~/model/guideline";
import { encodeGuidelines, decodeGuidelines } from "~/lib/markdown-converter";

interface GuidelinesProps {
  content: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function Guidelines({
  content,
  onAnalysisComplete,
}: GuidelinesProps): React.JSX.Element {
  const {
    guidelines,
    isAnalyzing,
    analysisResult,
    analysisError,
    isEditMode,
    markdownContent,
    updateGuideline,
    analyze,
    setGuidelines,
    enterEditMode,
    exitEditMode,
    setMarkdownContent,
  } = useGuidelines();

  const [selectedGuidelineId, setSelectedGuidelineId] = React.useState<
    number | null
  >(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAnalyze = async (): Promise<void> => {
    await analyze(content);
  };

  const handleExport = (): void => {
    const markdown = encodeGuidelines(guidelines);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guidelines.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const markdown = event.target?.result as string;
      if (markdown) {
        const importedGuidelines = decodeGuidelines(markdown);
        // Replace all guidelines with imported ones in a single state update
        setGuidelines(importedGuidelines);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

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

  // Notify parent when analysis completes
  React.useEffect(() => {
    if (analysisResult && onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  }, [analysisResult, onAnalysisComplete]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Analyzing...</div>
        </div>
      )}

      {/* Header with buttons */}
      <div className="px-4 py-3 shrink-0 flex items-center justify-between border-b border-border">
        {!isEditMode && (
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim() || guidelines.length === 0}
            className="gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            Analyze
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
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
            </>
          )}
          <Button
            size="sm"
            variant={isEditMode ? "default" : "ghost"}
            onClick={() => (isEditMode ? exitEditMode(true) : enterEditMode())}
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
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {analysisError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {analysisError}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0">
        {isEditMode ? (
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
        ) : (
          <GuidelinesList
            guidelines={guidelines}
            violations={analysisResult?.violations || []}
            selectedGuidelineId={selectedGuidelineId}
            onSelectGuideline={setSelectedGuidelineId}
            onUpdateGuideline={updateGuideline}
          />
        )}
      </div>
    </div>
  );
}
