import * as React from "react";
import type { GuidelineViolation } from "~/model/guideline";

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
  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-3 shrink-0">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Blog Post Content
        </h2>
      </div>
      <div className="flex-1 px-8 pb-4 overflow-y-auto min-h-0">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Paste or type your blog post content here..."
          className="w-full h-full p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}
