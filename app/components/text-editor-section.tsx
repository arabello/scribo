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
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Paste or type your blog post content here..."
        className="w-full h-full px-10 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
