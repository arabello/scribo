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
      {/* Backdrop layer - positioned behind textarea with border and background */}
      <TextHighlightLayer
        content={content}
        highlights={highlightTexts}
        ref={highlightRef}
        className="absolute inset-0 z-[1] border-2 border-border bg-background rounded-md overflow-auto pointer-events-none p-10"
      />

      {/* Textarea - positioned in front with transparent background */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onScroll={handleScroll}
        placeholder="Paste or type your blog post content here..."
        className="relative z-[2] w-full h-full p-10 m-0 border-2 border-border rounded-none bg-transparent overflow-auto resize-none focus:outline-none focus:ring-2 focus:ring-primary text-base leading-normal"
      />
    </div>
  );
}
